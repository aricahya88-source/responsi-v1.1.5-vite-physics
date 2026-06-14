import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getSql, ensureSchema } from "./api/_db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

const sql = getSql();

if (sql) {
  ensureSchema(sql).catch(console.error);
}

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "dist")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, mode: sql ? "neon" : "no-db" });
});

// USERS (NEON + fallback)
app.get("/api/users", async (_req, res) => {
  try {
    if (!sql) return res.json({ mode: "demo-no-database", users: [] });
    const users = await sql`
      SELECT id, role, name, nim, class_name AS "className", access_code AS "accessCode", created_at AS "createdAt"
      FROM lab_users
      ORDER BY created_at DESC
    `;
    res.json({ users });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const payload = req.body || {};

    if (!sql) return res.status(200).json({ mode: "demo-no-database", users: [] });

    const items = Array.isArray(payload) ? payload : Array.isArray(payload.users) ? payload.users : [payload];
    const saved = [];

    for (const body of items) {
      const id = body.id || `student-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const rows = await sql`
        INSERT INTO lab_users (id, role, name, nim, class_name, access_code)
        VALUES (${id}, ${body.role || "student"}, ${body.name}, ${body.nim}, ${body.className || ""}, ${body.accessCode || ""})
        ON CONFLICT (nim) DO UPDATE SET
          name = EXCLUDED.name,
          class_name = EXCLUDED.class_name,
          access_code = EXCLUDED.access_code
        RETURNING id, role, name, nim, class_name AS "className", access_code AS "accessCode", created_at AS "createdAt"
      `;
      saved.push(rows[0]);
    }

    res.status(201).json({ ok: true, users: saved, user: saved[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/users", async (req, res) => {
  try {
    if (!sql) return res.json({ mode: "demo-no-database", ok: true });
    const id = req.query.id;
    await sql`DELETE FROM lab_users WHERE id = ${id}`;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// SUBMISSIONS
app.get("/api/submissions", async (_req, res) => {
  try {
    if (!sql) return res.json({ mode: "demo-no-database", submissions: [] });

    const rows = await sql`
      SELECT id, payload, score, feedback, created_at AS "createdAt", graded_at AS "gradedAt"
      FROM lab_submissions
      ORDER BY created_at DESC
    `;
    const submissions = rows.map((row) => ({
      ...(row.payload || {}),
      id: row.id,
      createdAt: row.payload?.createdAt || row.createdAt,
      updatedAt: row.payload?.updatedAt || row.createdAt,
      grade: row.score === null || row.score === undefined
        ? row.payload?.grade
        : { score: Number(row.score), feedback: row.feedback || "", gradedAt: row.gradedAt }
    }));
    res.json({ submissions });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/submissions", async (req, res) => {
  try {
    if (!sql) return res.json({ mode: "demo-no-database", ok: true });
    const body = req.body;

    await sql`
      INSERT INTO lab_submissions (id, student_nim, student_name, class_name, practicum_id, practicum_title, report_url, payload)
      VALUES (
        ${body.id},
        ${body.student?.nim || ""},
        ${body.student?.name || ""},
        ${body.student?.className || ""},
        ${body.practicum?.id || ""},
        ${body.practicum?.title || ""},
        ${body.report?.url || ""},
        ${JSON.stringify(body)}::jsonb
      )
      ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload
    `;

    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch("/api/submissions", async (req, res) => {
  try {
    if (!sql) return res.json({ mode: "demo-no-database", ok: true });
    const body = req.body;

    await sql`
      UPDATE lab_submissions
      SET score = ${body.score}, feedback = ${body.feedback || ""}, graded_at = NOW()
      WHERE id = ${body.id}
    `;

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, () => {
  console.log("Server running on port", port);
});