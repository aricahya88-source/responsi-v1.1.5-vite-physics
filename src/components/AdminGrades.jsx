import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

function stripHtml(html = "") {
  return String(html).replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function sanitizeHtml(html = "") {
  return String(html)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

function normalizeText(value = "") {
  return String(value).trim().toLowerCase();
}

function normalizeKey(key = "") {
  return String(key).trim().toLowerCase().replace(/\s+/g, "_");
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID");
}

function getStudentLabel(submission) {
  return submission.student?.name || "Tanpa nama";
}

function getSubmissionStatus(submission) {
  return submission.grade?.score !== undefined && submission.grade?.score !== null ? "Sudah dinilai" : "Belum dinilai";
}

function downloadWorkbook(filename, sheets) {
  const workbook = XLSX.utils.book_new();
  sheets.forEach(({ name, rows }) => {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, name.slice(0, 31));
  });
  XLSX.writeFile(workbook, filename);
}

function rowToImportedGrade(row) {
  const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeKey(key), value]));
  return {
    submissionId: String(
      normalized.submission_id ??
      normalized.id_submission ??
      normalized.id_submit ??
      normalized.id ??
      ""
    ).trim(),
    nim: String(normalized.nim ?? "").trim(),
    practicumId: String(normalized.practicum_id ?? normalized.id_praktikum ?? "").trim(),
    practicumTitle: String(normalized.praktikum ?? normalized.nama_praktikum ?? normalized.practicum ?? "").trim(),
    score: normalized.nilai ?? normalized.score ?? normalized.skor ?? "",
    feedback: String(
      normalized.catatan_admin ??
      normalized.catatan ??
      normalized.feedback ??
      normalized.umpan_balik ??
      ""
    ).trim()
  };
}

export default function AdminGrades({ submissions, onGradeSubmission, onImportGrades }) {
  const importInputRef = useRef(null);
  const [activeId, setActiveId] = useState(submissions[0]?.id ?? "");
  const [openedStudents, setOpenedStudents] = useState({});
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("muted");
  const [importing, setImporting] = useState(false);

  const sorted = useMemo(
    () => [...submissions].sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0) - new Date(a.updatedAt ?? a.createdAt ?? 0)),
    [submissions]
  );

  const active = useMemo(
    () => sorted.find((item) => item.id === activeId) ?? sorted[0] ?? null,
    [activeId, sorted]
  );

  const grouped = useMemo(() => {
    const groups = new Map();
    sorted.forEach((submission) => {
      const studentName = getStudentLabel(submission);
      const nim = submission.student?.nim || "-";
      const groupKey = `${normalizeText(studentName)}|${normalizeText(nim)}`;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          key: groupKey,
          name: studentName,
          nim,
          className: submission.student?.className || "-",
          submissions: []
        });
      }
      groups.get(groupKey).submissions.push(submission);
    });

    return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, "id-ID"));
  }, [sorted]);

  useEffect(() => {
    if (!sorted.length) {
      setActiveId("");
      return;
    }
    if (!activeId || !sorted.some((item) => item.id === activeId)) {
      setActiveId(sorted[0].id);
    }
  }, [activeId, sorted]);

  useEffect(() => {
    setScore(active?.grade?.score ?? "");
    setFeedback(active?.grade?.feedback ?? "");
    if (active?.student) {
      const key = `${normalizeText(active.student.name)}|${normalizeText(active.student.nim || "-")}`;
      setOpenedStudents((current) => ({ ...current, [key]: true }));
    }
  }, [active?.id]);

  const choose = (id) => {
    setMessage("");
    setActiveId(id);
  };

  const save = () => {
    if (!active) return;
    const numericScore = Number(score);
    if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 100) {
      setMessageType("warning");
      setMessage("Nilai wajib berupa angka 0 sampai 100.");
      return;
    }

    onGradeSubmission(active.id, {
      score: numericScore,
      feedback,
      gradedAt: new Date().toISOString()
    });
    setMessageType("success");
    setMessage("Nilai berhasil disimpan.");
  };

  const exportAnswers = () => {
    const rows = sorted.flatMap((submission) => {
      const answers = submission.practicum?.essayAnswers || [];
      if (!answers.length) {
        return [{
          "Submission ID": submission.id,
          "Nama Mahasiswa": submission.student?.name || "",
          "NIM": submission.student?.nim || "",
          "Kelas": submission.student?.className || "",
          "Praktikum": submission.practicum?.title || "",
          "Waktu Submit": formatDate(submission.createdAt),
          "Status Nilai": getSubmissionStatus(submission),
          "Link Laporan": submission.report?.url || "",
          "No Soal": "",
          "Pertanyaan": "",
          "Jawaban Mahasiswa": ""
        }];
      }

      return answers.map((item) => ({
        "Submission ID": submission.id,
        "Nama Mahasiswa": submission.student?.name || "",
        "NIM": submission.student?.nim || "",
        "Kelas": submission.student?.className || "",
        "Praktikum": submission.practicum?.title || "",
        "Waktu Submit": formatDate(submission.createdAt),
        "Status Nilai": getSubmissionStatus(submission),
        "Link Laporan": submission.report?.url || "",
        "No Soal": item.questionNumber || "",
        "Pertanyaan": item.question || "",
        "Jawaban Mahasiswa": stripHtml(item.answer || item.plainText || "")
      }));
    });

    downloadWorkbook(`hasil-jawaban-mahasiswa-${new Date().toISOString().slice(0, 10)}.xlsx`, [
      { name: "Jawaban Mahasiswa", rows }
    ]);
  };

  const exportGrades = () => {
    const rows = sorted.map((submission) => ({
      "Submission ID": submission.id,
      "Nama Mahasiswa": submission.student?.name || "",
      "NIM": submission.student?.nim || "",
      "Kelas": submission.student?.className || "",
      "Praktikum ID": submission.practicum?.id || "",
      "Praktikum": submission.practicum?.title || "",
      "Waktu Submit": formatDate(submission.createdAt),
      "Nilai": submission.grade?.score ?? "",
      "Catatan Admin": submission.grade?.feedback || "",
      "Tanggal Dinilai": formatDate(submission.grade?.gradedAt),
      "Link Laporan": submission.report?.url || ""
    }));

    const templateRows = rows.length ? rows : [{
      "Submission ID": "",
      "Nama Mahasiswa": "",
      "NIM": "",
      "Kelas": "",
      "Praktikum ID": "",
      "Praktikum": "",
      "Waktu Submit": "",
      "Nilai": "",
      "Catatan Admin": "",
      "Tanggal Dinilai": "",
      "Link Laporan": ""
    }];

    downloadWorkbook(`nilai-mahasiswa-${new Date().toISOString().slice(0, 10)}.xlsx`, [
      { name: "Nilai Mahasiswa", rows: templateRows }
    ]);
  };

  const handleImportGrades = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage("");
    setMessageType("muted");
    setImporting(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" }).map(rowToImportedGrade);
      const validRows = rows.filter((row) => row.score !== "" && row.score !== null && row.score !== undefined);

      if (!validRows.length) {
        setMessageType("warning");
        setMessage("File tidak memiliki baris nilai yang valid. Minimal isi kolom Nilai/Score.");
        return;
      }

      const result = await onImportGrades(validRows);
      setMessageType(result?.imported ? "success" : "warning");
      setMessage(`Import selesai. ${result?.imported || 0} nilai diperbarui, ${result?.skipped || 0} baris dilewati.`);
    } catch {
      setMessageType("warning");
      setMessage("Gagal membaca file Excel. Gunakan file hasil Export Nilai Mahasiswa sebagai template import.");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const toggleStudent = (key) => {
    setOpenedStudents((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <section className="admin-page grades-page">
      <div className="panel admin-hero">
        <p className="eyebrow">Admin</p>
        <h2>Menu Nilai</h2>
        <p>Data nilai dikelompokkan berdasarkan nama mahasiswa. Klik nama mahasiswa, lalu tekan Buka Jawaban untuk melihat detail jawaban.</p>
      </div>

      <section className="panel grade-tools-panel">
        <div className="panel-heading compact">
          <p className="eyebrow">Excel</p>
          <h3>Export / Import Data Nilai</h3>
        </div>
        <div className="action-row grade-action-row">
          <button type="button" className="secondary" onClick={exportAnswers} disabled={!sorted.length}>Export Hasil Jawaban Mahasiswa</button>
          <button type="button" className="secondary" onClick={exportGrades} disabled={!sorted.length}>Export Nilai Mahasiswa</button>
          <button type="button" onClick={() => importInputRef.current?.click()} disabled={importing || !sorted.length}>
            {importing ? "Mengimpor..." : "Import Nilai Mahasiswa"}
          </button>
          <input ref={importInputRef} className="hidden-file-input" type="file" accept=".xlsx,.xls" onChange={handleImportGrades} />
        </div>
        <p className="helper-text small-note">Saran: klik Export Nilai Mahasiswa dulu, isi kolom Nilai dan Catatan Admin, lalu upload kembali dengan tombol Import Nilai Mahasiswa.</p>
        {message ? <p className={`notice ${messageType}`}>{message}</p> : null}
      </section>

      {sorted.length === 0 ? (
        <section className="panel empty-state">
          <h3>Belum ada submit</h3>
          <p>Jawaban mahasiswa akan muncul di sini setelah tombol Simpan Jawaban ditekan.</p>
        </section>
      ) : (
        <div className="grades-layout">
          <section className="panel submission-list grouped-submission-list">
            <div className="panel-heading compact">
              <p className="eyebrow">Submit Masuk</p>
              <h3>{grouped.length} Mahasiswa · {sorted.length} Rekaman</h3>
            </div>
            <div className="student-groups">
              {grouped.map((group) => (
                <article className="student-grade-group" key={group.key}>
                  <button type="button" className="student-group-header" onClick={() => toggleStudent(group.key)}>
                    <span>
                      <strong>{group.name}</strong>
                      <small>{group.nim} · {group.className || "Tanpa kelas"}</small>
                    </span>
                    <em>{group.submissions.length} submit {openedStudents[group.key] ? "▴" : "▾"}</em>
                  </button>

                  {openedStudents[group.key] ? (
                    <div className="submission-buttons grouped-buttons">
                      {group.submissions.map((submission) => (
                        <button key={submission.id} type="button" className={active?.id === submission.id ? "active" : ""} onClick={() => choose(submission.id)}>
                          <strong>{submission.practicum?.title || "Praktikum"}</strong>
                          <span>{getSubmissionStatus(submission)}{submission.grade?.score !== undefined && submission.grade?.score !== null ? ` · Nilai ${submission.grade.score}` : ""}</span>
                          <small>{formatDate(submission.updatedAt ?? submission.createdAt)}</small>
                          <b>Buka Jawaban</b>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>

          {active ? (
            <section className="panel grade-detail">
              <div className="panel-heading compact">
                <p className="eyebrow">Detail Jawaban</p>
                <h3>{active.student?.name || "Tanpa nama"}</h3>
              </div>
              <div className="submission-meta">
                <span>NIM: <strong>{active.student?.nim || "-"}</strong></span>
                <span>Kelas: <strong>{active.student?.className || "-"}</strong></span>
                <span>Praktikum: <strong>{active.practicum?.title || "-"}</strong></span>
                <span>Waktu submit: <strong>{formatDate(active.createdAt)}</strong></span>
              </div>
              {active.report?.url ? <a className="report-link" href={active.report.url} target="_blank" rel="noreferrer">Buka laporan Google Drive</a> : <p className="helper-text">Tidak ada link laporan Google Drive.</p>}

              <div className="answer-review">
                {(active.practicum?.essayAnswers || []).map((item) => (
                  <details className="answer-detail" key={item.questionNumber} open>
                    <summary>Soal {item.questionNumber}</summary>
                    <article>
                      <p>{item.question}</p>
                      <div className="student-answer" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.answer || "<em>Belum dijawab</em>") }} />
                      <small>{stripHtml(item.answer || item.plainText || "").split(/\s+/).filter(Boolean).length} kata</small>
                    </article>
                  </details>
                ))}
              </div>

              <div className="grade-form">
                <label>
                  <span>Nilai</span>
                  <input type="number" min="0" max="100" value={score} onChange={(event) => setScore(event.target.value)} placeholder="0-100" />
                </label>
                <label>
                  <span>Catatan Admin</span>
                  <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows="4" placeholder="Umpan balik untuk mahasiswa" />
                </label>
                <button type="button" onClick={save}>Simpan Nilai</button>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </section>
  );
}
