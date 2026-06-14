import { neon } from "@neondatabase/serverless";

export function json(res, status, payload) {
  res.status(status).json(payload);
}

export function getSql() {
  if (!process.env.DATABASE_URL) return null;
  return neon(process.env.DATABASE_URL);
}

export async function ensureSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS lab_users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL DEFAULT 'student',
      name TEXT NOT NULL,
      nim TEXT UNIQUE,
      class_name TEXT,
      access_code TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS lab_submissions (
      id TEXT PRIMARY KEY,
      student_nim TEXT,
      student_name TEXT,
      class_name TEXT,
      practicum_id TEXT,
      practicum_title TEXT,
      report_url TEXT,
      payload JSONB NOT NULL,
      score NUMERIC,
      feedback TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      graded_at TIMESTAMPTZ
    )
  `;
}
