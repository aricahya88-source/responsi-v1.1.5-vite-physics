import { useMemo, useState } from "react";
import * as XLSX from "xlsx";

const emptyForm = { name: "", nim: "", className: "", accessCode: "" };

function normalizeKey(key = "") {
  return String(key).trim().toLowerCase().replace(/\s+/g, "_");
}

function rowToUser(row) {
  const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeKey(key), value]));
  return {
    name: String(normalized.nama || normalized.nama_mahasiswa || normalized.name || "").trim(),
    nim: String(normalized.nim || "").trim(),
    className: String(normalized.kelas || normalized.class || normalized.class_name || "").trim(),
    accessCode: String(normalized.kode_akses || normalized.password || normalized.access_code || "").trim()
  };
}

export default function AdminUsers({ users, onAddUser, onImportUsers, onSaveUsers, onDeleteUser }) {
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("muted");
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const students = useMemo(() => users.filter((user) => user.role === "student"), [users]);

  const submit = (event) => {
    event.preventDefault();
    setMessage("");
    setMessageType("muted");
    if (!form.name.trim() || !form.nim.trim() || !form.accessCode.trim()) {
      setMessageType("warning");
      setMessage("Nama, NIM, dan kode akses wajib diisi.");
      return;
    }
    const duplicate = students.some((student) => student.nim.trim().toLowerCase() === form.nim.trim().toLowerCase());
    if (duplicate) {
      setMessageType("warning");
      setMessage("NIM sudah terdaftar.");
      return;
    }
    onAddUser(form);
    setForm(emptyForm);
    setMessageType("muted");
    setMessage("Mahasiswa berhasil ditambahkan ke daftar. Klik Simpan ke Database agar terbaca di komputer lain.");
  };

  const handleExcelUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage("");
    setMessageType("muted");
    setImporting(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" }).map(rowToUser);
      const validRows = rows.filter((row) => row.name && row.nim && row.accessCode);
      const result = onImportUsers(validRows);
      setMessageType("muted");
      setMessage(`Import selesai. ${result.imported} mahasiswa ditambahkan ke daftar, ${result.skipped} baris dilewati. Klik Simpan ke Database agar terbaca di komputer lain.`);
    } catch (error) {
      setMessageType("warning");
      setMessage("Gagal membaca file Excel. Pastikan format kolom sesuai template.");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };


  const saveToDatabase = async () => {
    if (!onSaveUsers || saving) return;
    setMessage("");
    setMessageType("muted");
    setSaving(true);
    try {
      const result = await onSaveUsers();
      setMessageType(result?.ok ? "success" : "warning");
      setMessage(result?.message || "Proses simpan selesai.");
    } catch {
      setMessageType("warning");
      setMessage("Gagal menyimpan user ke database.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-page">
      <div className="panel admin-hero">
        <p className="eyebrow">Admin</p>
        <h2>Menu User</h2>
        <p>Tambahkan mahasiswa ke daftar, lalu tekan tombol Simpan ke Database agar data terbaca di komputer lain.</p>
      </div>

      <section className="panel import-panel">
        <div className="panel-heading compact">
          <p className="eyebrow">Import Excel</p>
          <h3>Tambah User Massal</h3>
        </div>
        <p className="helper-text">
          Gunakan template Excel yang disediakan. Kolom wajib: <strong>Nama</strong>, <strong>NIM</strong>, dan <strong>Kode Akses</strong>.
        </p>
        <div className="action-row">
          <a className="download-template" href="/templates/template-user-mahasiswa.xlsx" download>
            Download Template Excel
          </a>
          <label className="file-picker">
            <span>{importing ? "Mengimpor..." : "Upload Excel"}</span>
            <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} disabled={importing} />
          </label>
        </div>
      </section>

      <form className="panel admin-form" onSubmit={submit}>
        <div className="panel-heading compact">
          <p className="eyebrow">Tambah Manual</p>
          <h3>Data Mahasiswa</h3>
        </div>
        <label>
          <span>Nama Mahasiswa</span>
          <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nama lengkap" />
        </label>
        <label>
          <span>NIM</span>
          <input value={form.nim} onChange={(event) => setForm((current) => ({ ...current, nim: event.target.value }))} placeholder="Contoh: MHS002" />
        </label>
        <label>
          <span>Kelas</span>
          <input value={form.className} onChange={(event) => setForm((current) => ({ ...current, className: event.target.value }))} placeholder="Contoh: Fisika Dasar A" />
        </label>
        <label>
          <span>Kode Akses</span>
          <input value={form.accessCode} onChange={(event) => setForm((current) => ({ ...current, accessCode: event.target.value }))} placeholder="Kode login mahasiswa" />
        </label>
        {message ? <p className={`notice ${messageType}`}>{message}</p> : null}
        <div className="action-row save-user-actions">
          <button type="submit">Tambah ke Daftar</button>
          <button type="button" className="secondary" onClick={saveToDatabase} disabled={saving || students.length === 0}>
            {saving ? "Menyimpan..." : "Simpan ke Database"}
          </button>
        </div>
        <p className="helper-text small-note">Tombol simpan wajib ditekan setelah tambah manual atau import Excel supaya data mahasiswa masuk ke database Neon.</p>
      </form>

      <section className="panel table-panel">
        <div className="panel-heading compact">
          <p className="eyebrow">Daftar User</p>
          <h3>{students.length} Mahasiswa</h3>
          <button type="button" className="secondary compact-save" onClick={saveToDatabase} disabled={saving || students.length === 0}>
            {saving ? "Menyimpan..." : "Simpan ke Database"}
          </button>
        </div>
        {students.length === 0 ? (
          <p className="helper-text">Belum ada mahasiswa. Tambahkan manual atau upload Excel terlebih dahulu.</p>
        ) : (
          <div className="mobile-table">
            {students.map((student) => (
              <article className="table-card" key={student.id}>
                <div>
                  <strong>{student.name}</strong>
                  <span>{student.nim} · {student.className || "Tanpa kelas"}</span>
                  <small>Kode akses: {student.accessCode}</small>
                </div>
                <button type="button" className="ghost danger" onClick={() => onDeleteUser(student.id)}>Hapus</button>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
