import WysiwygEditor from "./WysiwygEditor.jsx";

export default function EssayPanel({ practicum, answers, onAnswerChange, locked, session, userKey = "anon" }) {
  return (
    <section className={`panel essay-panel ${locked ? "locked" : ""}`} aria-labelledby="essay-title">
      <div className="panel-heading">
        <p className="eyebrow">Evaluasi Pemahaman</p>
        <h2 id="essay-title">Pertanyaan Esai</h2>
      </div>

      <p className="helper-text">
        Amati simulasi, ubah variabel, baca hasil perhitungan, lalu tuliskan jawaban dengan bahasa sendiri.
      </p>

      <div className="essay-list">
        {practicum.questions.map((question, index) => (
          <div className="essay-item" key={question}>
            <span className="essay-question">
              <strong>Soal {index + 1}.</strong> {question}
            </span>
            <WysiwygEditor
              key={`${userKey}-${practicum.id}-${index}`}
              value={answers[index] ?? ""}
              onChange={(value) => onAnswerChange(index, value)}
              disabled={locked}
              storageKey={`physics-lab-editor-draft-v115:${userKey}:${practicum.id}:${index}`}
              placeholder="Tulis jawaban dengan bahasa sendiri berdasarkan simulasi..."
            />
          </div>
        ))}
      </div>
    </section>
  );
}
