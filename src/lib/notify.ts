/**
 * Tell Felisa when someone fills in a form.
 *
 * Sending goes through the platform's transactional endpoint. If no key is
 * configured we log and carry on: a missing notification must never cost us
 * the submission itself.
 */

const ORIGIN = new URL(
  process.env.NEXT_PUBLIC_RECURSIV_URL || "https://api.recursiv.io"
).origin;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://commongroundcampus.com";

function recipients(): string[] {
  const raw = process.env.NOTIFY_TO || "felisa@commongroundcampus.com,jack@minds.com";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface NotifyInput {
  /** Short line at the top, e.g. "Someone wants to host an event" */
  headline: string;
  /** Used in the subject after the site name */
  subject: string;
  /** Label / value pairs, rendered in order. Empty values are dropped. */
  fields: [string, string | null | undefined][];
  /** Free text shown as a quote block */
  body?: string | null;
  /** Where Reply should go. Usually the person who wrote in. */
  replyTo?: string;
  /** Where the "Open the inbox" button points */
  link?: string;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderEmail({ headline, fields, body, link }: NotifyInput): string {
  const rows = fields
    .filter(([, v]) => v && String(v).trim())
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:0 0 4px;font:600 11px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:#8d8b87;">${escape(label)}</td>
        </tr>
        <tr>
          <td style="padding:0 0 16px;font:400 16px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#141417;">${escape(String(value))}</td>
        </tr>`
    )
    .join("");

  const quote = body
    ? `<tr><td style="padding:4px 0 20px;">
         <div style="border-left:3px solid #3aa6f5;padding:2px 0 2px 16px;font:400 16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#3f3f46;white-space:pre-wrap;">${escape(body)}</div>
       </td></tr>`
    : "";

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f5f4f0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e2dd;">
        <tr><td style="height:4px;background:linear-gradient(90deg,#3aa6f5,#8b7cf8);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:28px 32px 0;">
          <p style="margin:0;font:700 12px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#3aa6f5;">Common Ground Campus</p>
          <h1 style="margin:10px 0 24px;font:600 22px/1.3 -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#141417;">${escape(headline)}</h1>
        </td></tr>
        <tr><td style="padding:0 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}${quote}</table>
        </td></tr>
        <tr><td style="padding:8px 32px 32px;">
          <a href="${escape(link || SITE + "/admin")}" style="display:inline-block;background:#3aa6f5;color:#141417;text-decoration:none;padding:12px 22px;font:600 14px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Open the inbox</a>
          <p style="margin:18px 0 0;font:400 13px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#6e6c68;">Reply to this email to answer them directly.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function renderText({ headline, fields, body, link }: NotifyInput): string {
  const lines = [headline, ""];
  for (const [label, value] of fields) {
    if (value && String(value).trim()) lines.push(`${label}: ${value}`);
  }
  if (body) lines.push("", body);
  lines.push("", `Open the inbox: ${link || SITE + "/admin"}`);
  lines.push("Reply to this email to answer them directly.");
  return lines.join("\n");
}

export async function notify(input: NotifyInput): Promise<void> {
  const key = process.env.RECURSIV_API_KEY;
  if (!key) {
    console.warn("notify: RECURSIV_API_KEY is not set, skipping email for:", input.subject);
    return;
  }

  const payload: Record<string, unknown> = {
    to: recipients(),
    subject: `Common Ground Campus: ${input.subject}`,
    html: renderEmail(input),
    text: renderText(input),
  };
  if (process.env.NOTIFY_FROM) payload.from = process.env.NOTIFY_FROM;
  if (input.replyTo) payload.reply_to = input.replyTo;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 6000);
  try {
    const res = await fetch(`${ORIGIN}/api/v1/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
      signal: ac.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`notify: send failed (${res.status})`, detail.slice(0, 300));
    }
  } catch (error) {
    console.error("notify: send threw", error);
  } finally {
    clearTimeout(timer);
  }
}
