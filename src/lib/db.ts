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
    if (!url) throw new Error("DATABASE_URL is not set - the platform injects it on deploy");
    pool = new Pool({ connectionString: url, max: 3 });
  }
  return pool;
}

async function ensureSchema(): Promise<void> {
  if (ready) return;
  const db = getPool();

  await db.query(`
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

  // Member numbers carry on from the 112 people already in Common Bridge.
  await db.query(`CREATE SEQUENCE IF NOT EXISTS member_number_seq START 112`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS members (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      member_number INTEGER NOT NULL UNIQUE DEFAULT nextval('member_number_seq'),
      email_optin BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // The Philadelphia Declaration count carries on from the signatures already
  // gathered on paper. Name and date of birth only: nothing else is collected.
  await db.query(`CREATE SEQUENCE IF NOT EXISTS signature_number_seq START 1200`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS declaration_signatures (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      birth_date DATE NOT NULL,
      signature_number INTEGER NOT NULL UNIQUE DEFAULT nextval('signature_number_seq'),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS host_requests (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      organization TEXT,
      location TEXT,
      event_type TEXT NOT NULL,
      message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  ready = true;
}

export async function query(sql: string, params?: unknown[]) {
  await ensureSchema();
  return getPool().query(sql, params);
}
