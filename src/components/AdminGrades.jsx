import { useMemo, useState } from "react";

function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export default function AdminGrades({ submissions, onGradeSubmission }) {
  const [activeId, setActiveId] = useState(submissions[0]?.id ?? "");
  const active = submissions.find((item) => item.id === activeId) ?? submissions[0];
  const [score, setScore] = useState(active?.grade?.score ?? "");
  const [feedback, setFeedback] = useState(active?.grade?.feedback ?? "");

  const sorted = useMemo(
    () => [...submissions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [submissions]
  );

  const choose = (id) => {
    const selected = submissions.find((item) => item.id === id);
    setActiveId(id);
    setScore(selected?.grade?.score ?? "");
    setFeedback(selected?.grade?.feedback ?? "");
  };

  const save = () => {
    if (!active) return;
    onGradeSubmission(active.id, {
      score: Number(score),
      feedback,
      gradedAt: new Date().toISOString()
    });
  };

  return (
    <section className="admin-page grades-page">
      <div className="panel admin-hero">
        <p className="eyebrow">Admin</p>
        <h2>Menu Nilai</h2>
        <p>Periksa jawaban praktikum mahasiswa yang sudah disimpan, lalu masukkan skor serta umpan balik.</p>
      </div>

      {sorted.length === 0 ? (
        <section className="panel empty-state">
          <h3>Belum ada submit</h3>
          <p>Jawaban mahasiswa akan muncul di sini setelah tombol Simpan Jawaban ditekan.</p>
        </section>
      ) : (
        <div className="grades-layout">
          <section className="panel submission-list">
            <div className="panel-heading compact">
              <p className="eyebrow">Submit Masuk</p>
              <h3>{sorted.length} Rekaman</h3>
            </div>
            <div className="submission-buttons">
              {sorted.map((submission) => (
                <button key={submission.id} type="button" className={active?.id === submission.id ? "active" : ""} onClick={() => choose(submission.id)}>
                  <strong>{submission.student?.name || "Tanpa nama"}</strong>
                  <span>{submission.practicum?.title}</span>
                  <small>{new Date(submission.createdAt).toLocaleString("id-ID")}</small>
                </button>
              ))}
            </div>
          </section>

          {active ? (
            <section className="panel grade-detail">
              <div className="panel-heading compact">
                <p className="eyebrow">Detail Jawaban</p>
                <h3>{active.student?.name}</h3>
              </div>
              <div className="submission-meta">
                <span>NIM: <strong>{active.student?.nim}</strong></span>
                <span>Kelas: <strong>{active.student?.className || "-"}</strong></span>
                <span>Praktikum: <strong>{active.practicum?.title}</strong></span>
              </div>
              {active.report?.url ? <a className="report-link" href={active.report.url} target="_blank" rel="noreferrer">Buka laporan Google Drive</a> : <p className="helper-text">Tidak ada link laporan Google Drive.</p>}

              <div className="answer-review">
                {active.practicum?.essayAnswers?.map((item) => (
                  <article key={item.questionNumber}>
                    <strong>Soal {item.questionNumber}</strong>
                    <p>{item.question}</p>
                    <div className="student-answer" dangerouslySetInnerHTML={{ __html: item.answer || "<em>Belum dijawab</em>" }} />
                    <small>{stripHtml(item.answer).split(/\s+/).filter(Boolean).length} kata</small>
                  </article>
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
