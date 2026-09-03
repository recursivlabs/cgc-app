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
      share_slug TEXT UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // A membership can be shared by link, like a signature. Random slugs so
  // nobody can walk the member list by counting up.
  await db.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS share_slug TEXT UNIQUE`);
  await db.query(
    `UPDATE members
     SET share_slug = substr(md5(random()::text || id::text || clock_timestamp()::text), 1, 12)
     WHERE share_slug IS NULL`
  );

  // The Philadelphia Declaration count carries on from the signatures already
  // gathered on paper. Name and date of birth only: nothing else is collected.
  await db.query(`CREATE SEQUENCE IF NOT EXISTS signature_number_seq START 1200`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS declaration_signatures (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      birth_date DATE NOT NULL,
      signature_number INTEGER NOT NULL UNIQUE DEFAULT nextval('signature_number_seq'),
      share_slug TEXT UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // A signature can be shared by link. The slug is random so nobody can walk
  // the list of signers by counting up.
  await db.query(
    `ALTER TABLE declaration_signatures ADD COLUMN IF NOT EXISTS share_slug TEXT UNIQUE`
  );
  await db.query(
    `UPDATE declaration_signatures
     SET share_slug = substr(md5(random()::text || id::text || clock_timestamp()::text), 1, 12)
     WHERE share_slug IS NULL`
  );

  // Every "get in touch" form on the site lands here, told apart by kind,
  // so Felisa reads one list instead of chasing her inbox.
  await db.query(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id SERIAL PRIMARY KEY,
      kind TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      organization TEXT,
      location TEXT,
      detail TEXT,
      message TEXT,
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

  // Host requests predate the shared table. Move them across once.
  await db.query(`
    INSERT INTO inquiries (kind, name, email, organization, location, detail, message, created_at)
    SELECT 'host', name, email, organization, location, event_type, message, created_at
    FROM host_requests
    WHERE NOT EXISTS (SELECT 1 FROM inquiries WHERE kind = 'host')
  `);

  ready = true;
}

export async function query(sql: string, params?: unknown[]) {
  await ensureSchema();
  return getPool().query(sql, params);
}
