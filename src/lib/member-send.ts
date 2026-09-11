/**
 * Sending one member email to the whole list.
 *
 * Two callers share this: the button on the admin page and the scheduled run
 * that sends the day-of reminder. Both go through the same path so a
 * scheduled send behaves exactly like one a person pressed.
 */

import { query } from "@/lib/db";
import { MEMBER_EMAILS, grantConsent, sendMemberEmail } from "@/lib/member-email";
import { SITE_URL } from "@/lib/site";

const CONSENT_SOURCE = "Common Bridge member list provided by Common Ground Campus, 2026-09-03";

function unsubscribeUrl(token: string): string {
  return `${SITE_URL}/unsubscribe?t=${encodeURIComponent(token)}`;
}

export interface SendResult {
  sent: number;
  failed: string[];
  error?: string;
}

/**
 * Send one template to every member who has an address, has not unsubscribed,
 * and has not already had this one. Safe to call twice: the second call finds
 * nobody left.
 */
export async function sendToAllMembers(templateId: string): Promise<SendResult> {
  const build = MEMBER_EMAILS[templateId];
  if (!build) return { sent: 0, failed: [], error: "Unknown email." };

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
    if (!consent.ok) return { sent: 0, failed: [], error: consent.error };
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

  return { sent, failed };
}

/** Send one template to one address, for a test or a preview. */
export async function sendOne(templateId: string, to: string): Promise<SendResult> {
  const build = MEMBER_EMAILS[templateId];
  if (!build) return { sent: 0, failed: [], error: "Unknown email." };

  const consent = await grantConsent([to], "Site admin test send");
  if (!consent.ok) return { sent: 0, failed: [], error: consent.error };

  const out = await sendMemberEmail(to, build({ email: to, unsubscribeUrl: unsubscribeUrl("test") }));
  return out.ok ? { sent: 1, failed: [] } : { sent: 0, failed: [to], error: out.error };
}
