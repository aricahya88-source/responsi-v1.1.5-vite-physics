import { ensureSchema, getSql, json } from "./_db.js";

export default async function handler(req, res) {
  const sql = getSql();
  if (!sql) {
    return json(res, 200, {
      mode: "demo-no-database",
      message: "DATABASE_URL belum diatur. Frontend memakai localStorage.",
      users: []
    });
  }

  await ensureSchema(sql);

  if (req.method === "GET") {
    const rows = await sql`SELECT id, role, name, nim, class_name AS "className", access_code AS "accessCode", created_at AS "createdAt" FROM lab_users ORDER BY created_at DESC`;
    return json(res, 200, { users: rows });
  }

  if (req.method === "POST") {
    const payload = req.body || {};
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

    return json(res, 201, { users: saved, user: saved[0] });
  }

  if (req.method === "DELETE") {
    const id = req.query.id;
    await sql`DELETE FROM lab_users WHERE id = ${id}`;
    return json(res, 200, { ok: true });
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  return json(res, 405, { error: "Method not allowed" });
}
