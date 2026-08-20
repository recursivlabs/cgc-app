import { Pool } from "pg";

/**
 * Platform-injected Postgres (each project gets a database; the deploy pipeline
 * injects DATABASE_URL into the container). Local dev can set it in .env.
 */
let pool: Pool | null = null;
let ready = false;

function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set — the platform injects it on deploy");
    pool = new Pool({ connectionString: url, max: 3 });
  }
  return pool;
}

async function ensureSchema(): Promise<void> {
  if (ready) return;
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS rsvps (
      id SERIAL PRIMARY KEY,
      event_id TEXT NOT NULL,
      event_title TEXT NOT NULL,
      event_date TEXT,
      name TEXT,
      email TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(event_id, email)
    )
  `);
  ready = true;
}

export async function query(sql: string, params?: unknown[]) {
  await ensureSchema();
  return getPool().query(sql, params);
}
