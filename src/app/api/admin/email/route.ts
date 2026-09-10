import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { MEMBER_EMAILS, grantConsent, sendMemberEmail } from "@/lib/member-email";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const CONSENT_SOURCE = "Common Bridge member list provided by Common Ground Campus, 2026-09-03";

function unsubscribeUrl(token: string): string {
  return `${SITE_URL}/unsubscribe?t=${encodeURIComponent(token)}`;
}

/**
 * POST /api/admin/email
 * { template: "summit-2026-09", mode: "test" | "all" }
 *
 * "test" sends the email to the signed-in admin only.
 * "all" sends it to every invited member who has an address and has not
 * unsubscribed, once. Anyone who already received this template is skipped,
 * so the button is safe to press twice.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Admins only." }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { template?: string; mode?: string };
  const build = body.template ? MEMBER_EMAILS[body.template] : undefined;
  if (!build) {
    return NextResponse.json({ error: "Unknown email." }, { status: 400 });
  }

  if (body.mode === "test") {
    const mail = build({ email: user.email, unsubscribeUrl: unsubscribeUrl("test") });
    const consent = await grantConsent([user.email], "Site admin test send");
    if (!consent.ok) {
      return NextResponse.json({ error: consent.error }, { status: 502 });
    }
    const out = await sendMemberEmail(user.email, mail);
    return NextResponse.json(out.ok ? { sent: 1, to: user.email } : { error: out.error }, {
      status: out.ok ? 200 : 502,
    });
  }

  if (body.mode !== "all") {
    return NextResponse.json({ error: "mode must be test or all." }, { status: 400 });
  }

  const templateId = build({ email: "", unsubscribeUrl: "" }).id;

  // Every member gets a token once; it stays the same across emails.
  await query(
    `UPDATE invited_members
        SET unsub_token = md5(random()::text || clock_timestamp()::text || email)
      WHERE unsub_token IS NULL AND email IS NOT NULL`
  );

  const res = await query(
    `SELECT DISTINCT ON (lower(email)) lower(email) AS email, unsub_token
       FROM invited_members
      WHERE email IS NOT NULL AND email <> ''
        AND unsubscribed_at IS NULL
        AND lower(email) NOT IN (SELECT email FROM member_email_sends WHERE template = $1)
      ORDER BY lower(email), id`,
    [templateId]
  );

  const rows = res.rows as { email: string; unsub_token: string }[];
  for (let i = 0; i < rows.length; i += 50) {
    const consent = await grantConsent(rows.slice(i, i + 50).map((r) => r.email), CONSENT_SOURCE);
    if (!consent.ok) {
      return NextResponse.json({ error: consent.error }, { status: 502 });
    }
  }

  let sent = 0;
  const failed: string[] = [];
  for (const row of rows) {
    const mail = build({ email: row.email, unsubscribeUrl: unsubscribeUrl(row.unsub_token) });
    const out = await sendMemberEmail(row.email, mail);
    if (out.ok) {
      sent += 1;
      await query(
        `INSERT INTO member_email_sends (template, email) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [templateId, row.email]
      );
    } else {
      failed.push(row.email);
      console.error("member email failed", row.email, out.error);
    }
  }

  return NextResponse.json({ sent, failed });
}
