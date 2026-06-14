import { useEffect, useState } from "react";
import { buildInitialAnswers, buildInitialValues, practicums } from "./data/practicums.js";
import AdminGrades from "./components/AdminGrades.jsx";
import AdminUsers from "./components/AdminUsers.jsx";
import BottomBar from "./components/BottomBar.jsx";
import ControlsPanel from "./components/ControlsPanel.jsx";
import EssayPanel from "./components/EssayPanel.jsx";
import GuidePage from "./components/GuidePage.jsx";
import LoginScreen from "./components/LoginScreen.jsx";
import MetricsPanel from "./components/MetricsPanel.jsx";
import ReportPanel from "./components/ReportPanel.jsx";
import Simulation3D from "./components/Simulation3D.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";

const STORAGE = {
  draftBase: "physics-lab-draft-v115",
  session: "physics-lab-session-v11",
  users: "physics-lab-users-v11",
  submissions: "physics-lab-submissions-v11",
  theme: "physics-lab-theme-v11"
};

const defaultUsers = [];

const studentNav = [
  { id: "guide", shortTitle: "Panduan", title: "Panduan", icon: "?" },
  ...practicums
];

const adminNav = [
  { id: "guide", shortTitle: "Panduan", title: "Panduan", icon: "?" },
  { id: "admin-users", shortTitle: "User", title: "User", icon: "👥" },
  { id: "admin-grades", shortTitle: "Nilai", title: "Nilai", icon: "★" },
  ...practicums
];

function readJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, payload) {
  try {
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Jangan sampai kegagalan localStorage membuat aplikasi crash atau menghapus jawaban yang sedang diketik.
  }
}

function getUserKey(sessionOrUser) {
  const user = sessionOrUser?.user ?? sessionOrUser;
  if (!user) return "anon";
  return String(user.nim || user.username || user.id || user.name || "anon")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-");
}

function getStudentDraftKey(sessionOrUser) {
  return `${STORAGE.draftBase}:${getUserKey(sessionOrUser)}`;
}

function buildBlankWorkspace() {
  return {
    activeId: "guide",
    valuesById: buildInitialValues(),
    answersById: buildInitialAnswers(),
    reportsById: buildInitialReports()
  };
}

function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildInitialReports() {
  return Object.fromEntries(
    practicums.map((practicum) => [practicum.id, { url: "", savedAt: "", previewOpen: false }])
  );
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function useStudentGuard(active) {
  const [guardMessage, setGuardMessage] = useState("");

  useEffect(() => {
    if (!active) return undefined;

    const block = (event, message = "Aksi ini dinonaktifkan selama pengerjaan praktikum.") => {
      event.preventDefault();
      event.stopPropagation();
      setGuardMessage(message);
      window.setTimeout(() => setGuardMessage(""), 2200);
    };

    const onContextMenu = (event) => block(event, "Klik kanan dinonaktifkan pada mode mahasiswa.");
    const onCopy = (event) => {
      if (event.target?.closest?.('[data-allow-copy="true"]')) return;
      block(event, "Copy dinonaktifkan. Gunakan bahasa sendiri untuk jawaban esai.");
    };
    const onPaste = (event) => {
      if (event.target?.closest?.('[data-allow-paste="true"]')) return;
      block(event, "Paste dinonaktifkan pada jawaban. Tulis esai secara mandiri.");
    };
    const onCut = (event) => block(event, "Cut dinonaktifkan pada mode mahasiswa.");
    const onDragStart = (event) => block(event);
    const onKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const allowedTarget = event.target?.closest?.('[data-allow-paste="true"], [data-allow-copy="true"]');
      const blockedCombo =
        (event.ctrlKey || event.metaKey) && ["c", "v", "x", "a", "s", "p", "u", "i", "j"].includes(key);
      if (allowedTarget && ["c", "v", "a"].includes(key)) return;
      if (blockedCombo) block(event, "Shortcut ini dinonaktifkan selama praktikum.");
      if (event.key === "PrintScreen") block(event, "Screenshot tidak dapat diblokir penuh oleh browser, tetapi tombol PrintScreen dicegah bila terdeteksi.");
    };
    const onBeforePrint = (event) => block(event, "Cetak halaman dinonaktifkan pada mode mahasiswa.");

    document.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("copy", onCopy, true);
    document.addEventListener("paste", onPaste, true);
    document.addEventListener("cut", onCut, true);
    document.addEventListener("dragstart", onDragStart, true);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("beforeprint", onBeforePrint, true);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu, true);
      document.removeEventListener("copy", onCopy, true);
      document.removeEventListener("paste", onPaste, true);
      document.removeEventListener("cut", onCut, true);
      document.removeEventListener("dragstart", onDragStart, true);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("beforeprint", onBeforePrint, true);
    };
  }, [active]);

  return guardMessage;
}

export default function App() {
  const [theme, setTheme] = useState(() => readJson(STORAGE.theme, "dark"));
  const [session, setSession] = useState(() => readJson(STORAGE.session, null));
  const [users, setUsers] = useState(() => readJson(STORAGE.users, defaultUsers));
  const [submissions, setSubmissions] = useState(() => readJson(STORAGE.submissions, []));
  const [activeId, setActiveId] = useState("guide");
  const [valuesById, setValuesById] = useState(() => buildInitialValues());
  const [answersById, setAnswersById] = useState(() => buildInitialAnswers());
  const [reportsById, setReportsById] = useState(() => buildInitialReports());
  const [payloadOpen, setPayloadOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const isStudent = session?.role === "student";
  const guardMessage = useStudentGuard(isStudent);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveJson(STORAGE.theme, theme);
  }, [theme]);

  

  

  useEffect(() => {
    if (session) saveJson(STORAGE.session, session);
    else localStorage.removeItem(STORAGE.session);
  }, [session]);

  useEffect(() => {
    saveJson(STORAGE.users, users);
  }, [users]);

  useEffect(() => {
    saveJson(STORAGE.submissions, submissions);
  }, [submissions]);

  useEffect(() => {
    if (session?.role !== "student" || !session?.user) return;
    const draft = {
      activeId,
      valuesById,
      answersById,
      reportsById,
      userKey: getUserKey(session),
      savedAt: new Date().toISOString()
    };
    saveJson(getStudentDraftKey(session), draft);
  }, [session?.role, session?.user?.id, session?.user?.nim, activeId, valuesById, answersById, reportsById]);

  const activePracticum = practicums.find((item) => item.id === activeId);
  const studentUserKey = getUserKey(session);
  const activeValues = activePracticum ? valuesById[activePracticum.id] : null;
  const activeAnswers = activePracticum ? answersById[activePracticum.id] ?? [] : [];
  const activeReport = activePracticum ? reportsById[activePracticum.id] ?? { url: "", savedAt: "", previewOpen: false } : null;
  const metrics = activePracticum ? activePracticum.calculate(activeValues) : null;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const mathNodes = Array.from(document.querySelectorAll(".mathjax-render"));
      if (!mathNodes.length || !window.MathJax?.typesetPromise) return;
      if (window.MathJax.typesetClear) {
        window.MathJax.typesetClear(mathNodes);
      }
      window.MathJax.typesetPromise(mathNodes).catch(() => undefined);
    }, 80);

    return () => window.clearTimeout(timer);
  }, [activeId, activePracticum?.id, activePracticum?.formulaLatex, theme]);

  
  useEffect(() => {
    let cancelled = false;

    const normalizeSubmission = (item) => {
      const payload = item?.payload && typeof item.payload === "object" ? item.payload : item;
      const grade = item?.score !== undefined && item?.score !== null
        ? {
            score: Number(item.score),
            feedback: item.feedback || "",
            gradedAt: item.gradedAt || item.graded_at || ""
          }
        : payload?.grade;

      return {
        ...payload,
        id: item?.id ?? payload?.id,
        createdAt: payload?.createdAt ?? item?.createdAt ?? item?.created_at ?? new Date().toISOString(),
        updatedAt: payload?.updatedAt ?? item?.updatedAt ?? item?.createdAt ?? item?.created_at ?? new Date().toISOString(),
        grade
      };
    };

    const loadUsers = async () => {
      try {
        const response = await fetch("/api/users");
        if (!response.ok) return;
        const data = await response.json();
        if (data.mode === "demo-no-database") return;
        if (!cancelled && Array.isArray(data.users)) setUsers(data.users);
      } catch {
        // Tetap gunakan localStorage jika API/database belum aktif.
      }
    };

    const loadSubmissions = async () => {
      try {
        const response = await fetch("/api/submissions");
        if (!response.ok) return;
        const data = await response.json();
        if (data.mode === "demo-no-database") return;
        if (!cancelled && Array.isArray(data.submissions)) {
          setSubmissions(data.submissions.map(normalizeSubmission));
        }
      } catch {
        // Tetap gunakan localStorage jika API/database belum aktif.
      }
    };

    loadUsers();
    loadSubmissions();

    return () => {
      cancelled = true;
    };
  }, []);


  const navItems = session?.role === "admin" ? adminNav : studentNav;

  const buildCurrentPayload = () => {
    if (!activePracticum) return null;
    return {
      app: "Laboratorium Fisika Virtual",
      version: "1.1.5",
      createdAt: new Date().toISOString(),
      student: session?.role === "student" ? session.user : null,
      report: activeReport,
      practicum: {
        id: activePracticum.id,
        title: activePracticum.title,
        formula: activePracticum.formula,
        formulaLatex: activePracticum.formulaLatex,
        controls: activeValues,
        metrics,
        essayAnswers: activePracticum.questions.map((question, index) => ({
          questionNumber: index + 1,
          question,
          answer: activeAnswers[index] ?? "",
          plainText: stripHtml(activeAnswers[index] ?? "")
        }))
      }
    };
  };

  const payload = buildCurrentPayload();

  useEffect(() => {
    if (!activePracticum || session?.role !== "student" || !session?.user?.id) return;

    const latestSaved = submissions
      .filter((item) => item.student?.id === session.user.id && item.practicum?.id === activePracticum.id)
      .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0) - new Date(a.updatedAt ?? a.createdAt ?? 0))[0];

    if (!latestSaved?.practicum?.essayAnswers) return;

    setAnswersById((current) => {
      const restoredAnswers = latestSaved.practicum.essayAnswers.map((answer) => answer.answer ?? "");
      const currentAnswers = current[activePracticum.id] ?? [];
      const isSame = JSON.stringify(currentAnswers) === JSON.stringify(restoredAnswers);
      if (isSame) return current;
      return { ...current, [activePracticum.id]: restoredAnswers };
    });

    if (latestSaved.report) {
      setReportsById((current) => ({
        ...current,
        [activePracticum.id]: {
          ...(current[activePracticum.id] ?? {}),
          ...latestSaved.report,
          previewOpen: false
        }
      }));
    }
  }, [activePracticum?.id, session?.role, session?.user?.id, submissions]);

  const updateTheme = (nextTheme) => setTheme(nextTheme);

  const handleLogin = (nextSession) => {
    setSession(nextSession);
    setNotice("");
    setPayloadOpen(false);

    if (nextSession.role === "student") {
      const saved = readJson(getStudentDraftKey(nextSession), null);
      setActiveId(saved?.activeId ?? "guide");
      setValuesById(saved?.valuesById ?? buildInitialValues());
      setAnswersById(saved?.answersById ?? buildInitialAnswers());
      setReportsById(saved?.reportsById ?? buildInitialReports());
      return;
    }

    setActiveId("admin-users");
    setValuesById(buildInitialValues());
    setAnswersById(buildInitialAnswers());
    setReportsById(buildInitialReports());
  };

  const logout = () => {
    setSession(null);
    setActiveId("guide");
    setValuesById(buildInitialValues());
    setAnswersById(buildInitialAnswers());
    setReportsById(buildInitialReports());
    setPayloadOpen(false);
    setNotice("");
  };

  const updateControl = (controlId, value) => {
    if (!activePracticum) return;
    setValuesById((current) => ({
      ...current,
      [activePracticum.id]: {
        ...current[activePracticum.id],
        [controlId]: value
      }
    }));
  };

  const updateAnswer = (index, value) => {
    if (!activePracticum) return;
    setAnswersById((current) => {
      const nextAnswers = [...(current[activePracticum.id] ?? [])];
      nextAnswers[index] = value;
      return {
        ...current,
        [activePracticum.id]: nextAnswers
      };
    });
  };

  const readFreshEditorAnswers = () => {
    if (!activePracticum) return activeAnswers;
    return activePracticum.questions.map((_, index) => {
      const storageKey = `physics-lab-editor-draft-v115:${studentUserKey}:${activePracticum.id}:${index}`;
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved !== null) return saved;
      } catch {
        // Abaikan jika storage tidak tersedia.
      }
      return activeAnswers[index] ?? "";
    });
  };

  const buildPayloadFromAnswers = (answersForSave, reportForSave = activeReport) => {
    if (!activePracticum) return null;
    return {
      app: "Laboratorium Fisika Virtual",
      version: "1.1.5",
      createdAt: new Date().toISOString(),
      student: session?.role === "student" ? session.user : null,
      report: reportForSave,
      practicum: {
        id: activePracticum.id,
        title: activePracticum.title,
        formula: activePracticum.formula,
        formulaLatex: activePracticum.formulaLatex,
        controls: activeValues,
        metrics,
        essayAnswers: activePracticum.questions.map((question, index) => ({
          questionNumber: index + 1,
          question,
          answer: answersForSave[index] ?? "",
          plainText: stripHtml(answersForSave[index] ?? "")
        }))
      }
    };
  };

  const updateReport = (patch) => {
    if (!activePracticum) return;
    setReportsById((current) => ({
      ...current,
      [activePracticum.id]: {
        ...(current[activePracticum.id] ?? {}),
        ...patch
      }
    }));
  };

  const resetActive = () => {
    if (!activePracticum) return;
    const defaultValues = buildInitialValues()[activePracticum.id];
    setValuesById((current) => ({ ...current, [activePracticum.id]: defaultValues }));
    setAnswersById((current) => ({ ...current, [activePracticum.id]: activePracticum.questions.map(() => "") }));
    setReportsById((current) => ({ ...current, [activePracticum.id]: { url: "", savedAt: "", previewOpen: false } }));
    setNotice(`Praktikum ${activePracticum.title} direset ke nilai awal.`);
  };

  const saveCurrentPracticum = async () => {
    if (!session?.user || !activePracticum) return;

    const freshAnswers = readFreshEditorAnswers();
    const missingAnswer = activePracticum.questions.some((_, index) => stripHtml(freshAnswers[index] ?? "").length < 20);
    if (missingAnswer) {
      setNotice("Lengkapi kedua jawaban esai terlebih dahulu. Minimal 20 karakter per jawaban.");
      return;
    }

    const existingSubmission = submissions.find((item) =>
      item.student?.id === session.user.id &&
      item.practicum?.id === activePracticum.id &&
      !item.grade
    );

    if (existingSubmission?.grade) {
      setNotice("Jawaban praktikum ini sudah dinilai, sehingga tidak dapat diperbarui lagi.");
      return;
    }

    const now = new Date().toISOString();
    const reportForSave = activeReport?.url?.trim()
      ? { ...activeReport, savedAt: activeReport.savedAt || now, previewOpen: false }
      : { url: "", savedAt: "", previewOpen: false };

    const payloadForSave = buildPayloadFromAnswers(freshAnswers, reportForSave);

    const submission = {
      id: existingSubmission?.id ?? makeId("submission"),
      ...payloadForSave,
      report: reportForSave,
      createdAt: existingSubmission?.createdAt ?? now,
      updatedAt: now,
      status: "saved-editable"
    };

    setSubmissions((current) => {
      const existingIndex = current.findIndex((item) => item.id === submission.id);

      if (existingIndex >= 0) {
        const next = [...current];
        next[existingIndex] = submission;
        return next;
      }

      return [submission, ...current];
    });

    setAnswersById((current) => ({
      ...current,
      [activePracticum.id]: freshAnswers
    }));

    setReportsById((current) => ({
      ...current,
      [activePracticum.id]: reportForSave
    }));

    setNotice("Jawaban tersimpan. Saat kembali ke praktikum ini, jawaban akan dimuat kembali dan masih bisa diedit sebelum dinilai admin/dosen.");

    try {
      await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission)
      });
    } catch {
      // Aman diabaikan untuk mode lokal tanpa backend/serverless.
    }
  };

  const saveUsersToDatabase = async () => {
    const students = users.filter((user) => user.role === "student");

    if (!students.length) {
      return {
        ok: false,
        message: "Belum ada mahasiswa yang dapat disimpan. Tambahkan mahasiswa terlebih dahulu."
      };
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: students })
      });

      const data = await response.json().catch(() => ({}));

      if (data.mode === "demo-no-database") {
        return {
          ok: false,
          message: "DATABASE_URL belum terbaca. Data baru tersimpan di browser ini, belum masuk database."
        };
      }

      if (!response.ok) {
        return {
          ok: false,
          message: data.error || "Gagal menyimpan user ke database."
        };
      }

      const savedUsers = Array.isArray(data.users) ? data.users : [];
      if (savedUsers.length) {
        const byNim = new Map(savedUsers.map((item) => [String(item.nim || "").trim().toLowerCase(), item]));
        setUsers((current) => current.map((item) => {
          if (item.role !== "student") return item;
          const saved = byNim.get(String(item.nim || "").trim().toLowerCase());
          return saved ? { ...item, ...saved } : item;
        }));
      }

      return {
        ok: true,
        message: `${savedUsers.length || students.length} mahasiswa berhasil disimpan ke database.`
      };
    } catch {
      return {
        ok: false,
        message: "Tidak dapat menghubungi API/database. Data masih tersimpan lokal di browser."
      };
    }
  };

  const addUser = (form) => {
    const user = {
      id: makeId("student"),
      role: "student",
      name: form.name.trim(),
      nim: form.nim.trim(),
      className: form.className.trim(),
      accessCode: form.accessCode.trim(),
      createdAt: new Date().toISOString()
    };
    setUsers((current) => [...current, user]);
  };

  const importUsers = (rows) => {
    const existingNims = new Set(users.filter((user) => user.role === "student").map((user) => user.nim.trim().toLowerCase()));
    const cleanRows = rows
      .map((row) => ({
        name: String(row.name ?? row.nama ?? row["Nama Mahasiswa"] ?? "").trim(),
        nim: String(row.nim ?? row.NIM ?? row["NIM"] ?? "").trim(),
        className: String(row.className ?? row.kelas ?? row.Kelas ?? row["Kelas"] ?? "").trim(),
        accessCode: String(row.accessCode ?? row.kode_akses ?? row["Kode Akses"] ?? row["kode akses"] ?? "").trim()
      }))
      .filter((row) => row.name && row.nim && row.accessCode && !existingNims.has(row.nim.toLowerCase()));

    const imported = cleanRows.map((row) => ({
      id: makeId("student"),
      role: "student",
      name: row.name,
      nim: row.nim,
      className: row.className,
      accessCode: row.accessCode,
      createdAt: new Date().toISOString()
    }));

    setUsers((current) => [...current, ...imported]);
    return { imported: imported.length, skipped: rows.length - imported.length };
  };

  const deleteUser = (id) => {
    setUsers((current) => current.filter((user) => user.id !== id));
    fetch(`/api/users?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => undefined);
  };

  const gradeSubmission = (id, grade) => {
    setSubmissions((current) => current.map((submission) => (submission.id === id ? { ...submission, grade } : submission)));
    fetch("/api/submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, score: grade.score, feedback: grade.feedback })
    }).catch(() => undefined);
    setNotice("Nilai berhasil disimpan.");
  };

  const copyPayload = async () => {
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setNotice("Payload JSON disalin.");
    } catch {
      setPayloadOpen(true);
      setNotice("Clipboard tidak tersedia. Payload dibuka untuk disalin manual.");
    }
  };

  if (!session) {
    return <LoginScreen theme={theme} onThemeChange={updateTheme} users={users} onLogin={handleLogin} />;
  }

  const answeredCount = activeAnswers.filter((answer) => stripHtml(answer).length > 0).length;
  return (
    <div className={`app-shell ${isStudent ? "student-guard-active" : ""}`}>
      {guardMessage ? <div className="guard-toast" role="alert">{guardMessage}</div> : null}

      <header className="app-header">
        <div className="app-title-block">
          <div className="brand-mark small" aria-hidden="true">Φ</div>
          <div>
            <p className="eyebrow">Laboratorium Fisika Virtual</p>
            <h1>{activePracticum ? activePracticum.title : activeId === "admin-users" ? "User" : activeId === "admin-grades" ? "Nilai" : "Panduan"}</h1>
          </div>
        </div>
        <div className="header-actions">
          <ThemeToggle theme={theme} onThemeChange={updateTheme} />
          <button type="button" className="ghost" onClick={logout}>Keluar</button>
        </div>
      </header>

      <main className="app-main">
        <section className="panel identity-card">
          <div>
            <span>{session.role === "admin" ? "Admin" : "Mahasiswa"}</span>
            <strong>{session.user.name}</strong>
            {session.role === "student" ? <small>{session.user.nim} · {session.user.className || "Tanpa kelas"}</small> : <small>Panel pengelolaan praktikum</small>}
          </div>
          {activePracticum ? <div className="mini-progress">{answeredCount}/2 esai</div> : null}
        </section>

        {activeId === "guide" ? <GuidePage role={session.role} /> : null}
        {activeId === "admin-users" && session.role === "admin" ? (
          <AdminUsers
            users={users}
            onAddUser={addUser}
            onImportUsers={importUsers}
            onSaveUsers={saveUsersToDatabase}
            onDeleteUser={deleteUser}
          />
        ) : null}
        {activeId === "admin-grades" && session.role === "admin" ? <AdminGrades submissions={submissions} onGradeSubmission={gradeSubmission} /> : null}

        {activePracticum ? (
          <div className="practicum-layout">
            <section className="simulation-column">
              <div className="panel concept-panel">
                <div>
                  <p className="eyebrow">Konsep</p>
                  <h2>{activePracticum.title}</h2>
                  <p>{activePracticum.description}</p>
                  <p className="concept-text">{activePracticum.concept}</p>
                </div>
                <div className={`formula-card ${activePracticum.theme}`}>
                  <span>Rumus utama</span>
                  <strong key={`formula-${activePracticum.id}`} className="latex-formula mathjax-render">{`\\[${activePracticum.formulaLatex}\\]`}</strong>
                </div>
              </div>

              <Simulation3D practicum={activePracticum} values={activeValues} metrics={metrics} />
              <MetricsPanel metrics={metrics} />
            </section>

            <aside className="task-column">
              <ControlsPanel controls={activePracticum.controls} values={activeValues} onChange={updateControl} />
              {session.role === "student" ? (
                <ReportPanel practicum={activePracticum} report={activeReport} onChange={updateReport} />
              ) : null}
              <EssayPanel practicum={activePracticum} answers={activeAnswers} onAnswerChange={updateAnswer} locked={false} session={session} userKey={studentUserKey} />

              {session.role === "student" ? (
                <section className="panel submit-panel single-save-panel">
                  <div className="panel-heading compact">
                    <p className="eyebrow">Simpan</p>
                    <h2>Simpan Jawaban</h2>
                  </div>
                  <p>Tekan tombol ini setelah kedua jawaban esai selesai. Jawaban akan muncul kembali saat membuka praktikum ini dan masih bisa diedit sebelum dinilai admin/dosen.</p>
                  <div className="action-row save-only-row">
                    <button type="button" className="primary save-answer-button" onClick={saveCurrentPracticum}>Simpan Jawaban</button>
                  </div>
                  {notice ? <p className="notice">{notice}</p> : null}
                </section>
              ) : null}
            </aside>
          </div>
        ) : null}
      </main>

      <BottomBar items={navItems} activeId={activeId} onChange={setActiveId} />
    </div>
  );
}
