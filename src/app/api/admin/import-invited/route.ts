import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * One-shot roster import. Guarded by the IMPORT_KEY environment variable:
 * when the variable is not set, the endpoint is closed. It writes the
 * invited-members allowlist and sends NO email to anyone.
 */

interface IncomingMember {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  affiliation?: unknown;
}

function cleanName(v: unknown, max = 80): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().replace(/[\r\n\t]+/g, " ").slice(0, max);
  return t || null;
}

function cleanEmail(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().toLowerCase();
  if (!t || t.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return null;
  return t;
}

function keyMatches(given: string | null, expected: string): boolean {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const expected = process.env.IMPORT_KEY;
  if (!expected) {
    return NextResponse.json({ error: "Import is closed." }, { status: 404 });
  }
  if (!keyMatches(req.headers.get("x-import-key"), expected)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  let body: { source?: unknown; members?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON." }, { status: 400 });
  }

  const source = cleanName(body.source, 120);
  const members = Array.isArray(body.members) ? (body.members as IncomingMember[]) : null;
  if (!source || !members || members.length === 0 || members.length > 500) {
    return NextResponse.json({ error: "Need source and 1-500 members." }, { status: 400 });
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const m of members) {
    const firstName = cleanName(m.firstName);
    if (!firstName) {
      skipped++;
      continue;
    }
    const lastName = cleanName(m.lastName);
    const email = cleanEmail(m.email);
    const affiliation = cleanName(m.affiliation, 120);

    if (email) {
      const res = await query(
        `INSERT INTO invited_members (first_name, last_name, email, affiliation, source)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE
           SET first_name = EXCLUDED.first_name,
               last_name = EXCLUDED.last_name,
               affiliation = EXCLUDED.affiliation
         RETURNING (xmax = 0) AS is_insert`,
        [firstName, lastName, email, affiliation, source]
      );
      if (res.rows[0]?.is_insert) inserted++;
      else updated++;
    } else {
      // Roster-only rows (no email yet). Idempotent on name within a source.
      const res = await query(
        `INSERT INTO invited_members (first_name, last_name, email, affiliation, source)
         SELECT $1, $2, NULL, $3, $4
         WHERE NOT EXISTS (
           SELECT 1 FROM invited_members
           WHERE source = $4 AND email IS NULL
             AND first_name = $1 AND COALESCE(last_name, '') = COALESCE($2, '')
         )`,
        [firstName, lastName, affiliation, source]
      );
      if (res.rowCount) inserted++;
      else skipped++;
    }
  }

  return NextResponse.json({ inserted, updated, skipped, total: members.length });
}
