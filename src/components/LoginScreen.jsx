import { useMemo, useState } from "react";
import ThemeToggle from "./ThemeToggle.jsx";

export default function LoginScreen({ theme, onThemeChange, users, onLogin }) {
  const [role, setRole] = useState("student");
  const [adminUser, setAdminUser] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [nim, setNim] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");

  const studentCount = useMemo(() => users.filter((user) => user.role === "student").length, [users]);

  const submit = (event) => {
    event.preventDefault();
    setError("");

    if (role === "admin") {
      if (adminUser.trim() === "admin" && adminPassword === "admin123") {
        onLogin({ role: "admin", user: { id: "admin-local", name: "Administrator", username: "admin" } });
        return;
      }
      setError("Username atau password admin salah.");
      return;
    }

    const student = users.find(
      (user) =>
        user.role === "student" &&
        user.nim.trim().toLowerCase() === nim.trim().toLowerCase() &&
        user.accessCode === accessCode
    );

    if (!student) {
      setError("NIM atau kode akses mahasiswa tidak ditemukan. Admin dapat menambahkan mahasiswa dari menu User.");
      return;
    }

    onLogin({ role: "student", user: student });
  };

  return (
    <main className="login-page">
      <section className="login-card panel">
        <div className="login-topbar">
          <div className="brand-mark" aria-hidden="true">Φ</div>
          <ThemeToggle theme={theme} onThemeChange={onThemeChange} />
        </div>

        <div className="login-heading">
          <p className="eyebrow">Laboratorium Fisika Virtual</p>
          <h1>Masuk Praktikum</h1>
          <p>Pilih peran untuk mengakses simulasi mahasiswa atau panel pengelolaan admin.</p>
        </div>

        <div className="role-switch" role="tablist" aria-label="Pilih role login">
          <button type="button" className={role === "student" ? "active" : ""} onClick={() => setRole("student")}>Mahasiswa</button>
          <button type="button" className={role === "admin" ? "active" : ""} onClick={() => setRole("admin")}>Admin</button>
        </div>

        <form className="login-form" onSubmit={submit}>
          {role === "student" ? (
            <>
              <label>
                <span>NIM</span>
                <input value={nim} onChange={(event) => setNim(event.target.value)} placeholder="Contoh: MHS001" autoComplete="username" />
              </label>
              <label>
                <span>Kode Akses</span>
                <input type="password" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} placeholder="Kode dari dosen/admin" autoComplete="current-password" />
              </label>
              <p className="helper-text">Tersedia {studentCount} akun mahasiswa di penyimpanan lokal browser ini.</p>
            </>
          ) : (
            <>
              <label>
                <span>Username Admin</span>
                <input value={adminUser} onChange={(event) => setAdminUser(event.target.value)} placeholder="Username admin" autoComplete="username" />
              </label>
              <label>
                <span>Password Admin</span>
                <input type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder="Password admin" autoComplete="current-password" />
              </label>
              <p className="helper-text">Login ini hanya untuk prototipe. Saat Neon aktif, gunakan autentikasi backend yang aman.</p>
            </>
          )}

          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="primary-action">Masuk</button>
        </form>
      </section>
    </main>
  );
}
