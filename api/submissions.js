import { ensureSchema, getSql, json } from "./_db.js";

export default async function handler(req, res) {
  const sql = getSql();
  if (!sql) {
    return json(res, 200, {
      mode: "demo-no-database",
      message: "DATABASE_URL belum diatur. Data hanya tersimpan di localStorage browser.",
      submissions: []
    });
  }

  await ensureSchema(sql);

  if (req.method === "GET") {
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
    return json(res, 200, { submissions });
  }

  if (req.method === "POST") {
    const body = req.body || {};
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
      ON CONFLICT (id) DO UPDATE SET
        student_nim = EXCLUDED.student_nim,
        student_name = EXCLUDED.student_name,
        class_name = EXCLUDED.class_name,
        practicum_id = EXCLUDED.practicum_id,
        practicum_title = EXCLUDED.practicum_title,
        report_url = EXCLUDED.report_url,
        payload = EXCLUDED.payload
    `;
    return json(res, 201, { ok: true, id: body.id });
  }

  if (req.method === "PATCH") {
    const body = req.body || {};
    await sql`
      UPDATE lab_submissions
      SET score = ${body.score}, feedback = ${body.feedback || ""}, graded_at = NOW()
      WHERE id = ${body.id}
    `;
    return json(res, 200, { ok: true });
  }

  res.setHeader("Allow", "GET, POST, PATCH");
  return json(res, 405, { error: "Method not allowed" });
}
