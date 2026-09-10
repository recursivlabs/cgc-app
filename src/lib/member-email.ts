/**
 * Email to Common Bridge members. One template at a time, sent one
 * recipient at a time so nobody sees anyone else's address and every copy
 * carries its own one-click unsubscribe link. Sends go through the platform's
 * transactional endpoint under the org's sender name.
 */

import { SITE_URL } from "@/lib/site";

const ORIGIN = new URL(
  process.env.NEXT_PUBLIC_RECURSIV_URL || "https://api.recursiv.io"
).origin;

export interface MemberEmail {
  id: string;
  subject: string;
  html: string;
  text: string;
}

/** What a template needs to know about the person it is going to. */
export interface Recipient {
  email: string;
  /** Full one-click unsubscribe link for this person. */
  unsubscribeUrl: string;
}

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif";
const LINK = "color:#1f7fcc;";

function shell(eyebrow: string, title: string, lead: string, body: string, unsubscribeUrl: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f5f4f0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e2dd;">
        <tr><td style="height:4px;background:linear-gradient(90deg,#3aa6f5,#8b7cf8);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:28px 32px 0;">
          <p style="margin:0;font:700 12px/1.4 ${FONT};letter-spacing:.14em;text-transform:uppercase;color:#3aa6f5;">${eyebrow}</p>
          <h1 style="margin:10px 0 20px;font:600 24px/1.3 ${FONT};color:#141417;">${title}</h1>
          ${lead}
        </td></tr>
        <tr><td style="padding:0 32px;font:400 16px/1.6 ${FONT};color:#141417;">
          ${body}
        </td></tr>
        <tr><td style="padding:0 32px 28px;font:400 12px/1.6 ${FONT};color:#8d8b87;">
          You are receiving this because you are a Common Bridge member.
          <a href="${unsubscribeUrl}" style="color:#8d8b87;">Unsubscribe</a> with one click.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Google Calendar "add event" link. Times in UTC, formatted YYYYMMDDTHHMMSSZ. */
function googleCalendarUrl(opts: { title: string; startUtc: string; endUtc: string; details: string; location: string }) {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${opts.startUtc}/${opts.endUtc}`,
    details: opts.details,
    location: opts.location,
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

/** September 2026 Summit reminder. Felisa's words, lightly edited. */
export function summitSeptember2026(r: Recipient): MemberEmail {
  const meet = "https://meetn.com/1776";
  const title = "Common Bridge Summit: Disagreeing Without Disconnecting";
  // 8:00 to 9:00 pm ET on Sept 17 is 00:00 to 01:00 UTC on Sept 18 (EDT).
  const google = googleCalendarUrl({
    title,
    startUtc: "20260918T000000Z",
    endUtc: "20260918T010000Z",
    details: `Navigating disagreement in friendships and student groups. Meeting link: ${meet}`,
    location: meet,
  });
  const ics = `${SITE_URL}/api/ics?event=common-bridge-september`;

  const lead = `
          <p style="margin:0 0 6px;font:600 15px/1.5 ${FONT};color:#141417;">Thursday, September 17 &middot; 8:00 to 9:00 pm ET &middot; online</p>
          <p style="margin:0 0 24px;font:400 15px/1.6 ${FONT};color:#141417;">Add it to your calendar:
            <a href="${google}" style="${LINK}">Google</a> &middot;
            <a href="${ics}" style="${LINK}">Apple, Outlook and others</a>
          </p>`;
  const bullet = (label: string, text: string) =>
    `<tr><td style="padding:2px 10px 2px 0;vertical-align:top;color:#3aa6f5;">&bull;</td><td style="padding:2px 0;"><strong>${label}:</strong> ${text}</td></tr>`;
  const body = `
          <p style="margin:0 0 16px;">Hi everyone,</p>
          <p style="margin:0 0 16px;">Thank you to everyone who joined our first Common Bridge Summit last month. Common Ground Campus has been working on new ways to help young leaders connect, including our <a href="${SITE_URL}" style="${LINK}">new website</a>. If you could not make it, Common Bridge is an invitation-only monthly summit for past and present young leaders from organizations across the country and beyond.</p>
          <p style="margin:0 0 16px;">Common Bridge is an open space for you to gather with others and talk about the life and political topics that matter to you. The conversation is guided by you: no scripts, no rigid agendas, no policy debates. The goal is real dialogue, real relationships, and a place to share ideas.</p>
          <p style="margin:0 0 8px;">This session starts with a broad guiding theme:</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
            ${bullet("Topic", "Disagreeing Without Disconnecting")}
            ${bullet("Theme", "Navigating disagreement in friendships and student groups")}
            ${bullet("Objective", "Practice turning differences into stronger relationships")}
            ${bullet("Coming up", "Social Media, Changing Your Mind, and more. Feedback welcome.")}
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#f5f4f0;border-left:3px solid #3aa6f5;">
            <tr><td style="padding:14px 16px;font:400 15px/1.6 ${FONT};color:#141417;">
              <strong>When:</strong> Third Thursday of every month. Next one is <strong>September 17</strong>.<br>
              <strong>Time:</strong> 8:00 to 9:00 pm ET<br>
              <strong>Where:</strong> Online. The meeting link is in the calendar invite, and we will send it again the day of.
            </td></tr>
          </table>
          <p style="margin:0 0 16px;">You are a Common Bridge member on the new site. Sign in with your email to see your member number and your certificate: <a href="${SITE_URL}/member" style="${LINK}">commongroundcampus.com/member</a></p>
          <p style="margin:0 0 16px;">If you have any questions, just reply to this email. Excited to see you all there!</p>
          <p style="margin:0 0 4px;">Best,</p>
          <p style="margin:0 0 28px;">Felisa<br><a href="mailto:felisa@commongroundcampus.com" style="${LINK}">felisa@commongroundcampus.com</a><br><a href="${SITE_URL}" style="${LINK}">commongroundcampus.com</a></p>`;

  const text = [
    title,
    "Thursday, September 17, 8:00 to 9:00 pm ET, online.",
    `Add to Google Calendar: ${google}`,
    `Add to Apple, Outlook and others: ${ics}`,
    "",
    "Hi everyone,",
    "",
    `Thank you to everyone who joined our first Common Bridge Summit last month. Common Ground Campus has been working on new ways to help young leaders connect, including our new website: ${SITE_URL}. If you could not make it, Common Bridge is an invitation-only monthly summit for past and present young leaders from organizations across the country and beyond.`,
    "",
    "Common Bridge is an open space for you to gather with others and talk about the life and political topics that matter to you. The conversation is guided by you: no scripts, no rigid agendas, no policy debates. The goal is real dialogue, real relationships, and a place to share ideas.",
    "",
    "This session starts with a broad guiding theme:",
    "- Topic: Disagreeing Without Disconnecting",
    "- Theme: Navigating disagreement in friendships and student groups",
    "- Objective: Practice turning differences into stronger relationships",
    "- Coming up: Social Media, Changing Your Mind, and more. Feedback welcome.",
    "",
    "When: Third Thursday of every month. Next one is September 17.",
    "Time: 8:00 to 9:00 pm ET",
    "Where: Online. The meeting link is in the calendar invite, and we will send it again the day of.",
    "",
    `You are a Common Bridge member on the new site. Sign in with your email to see your member number and your certificate: ${SITE_URL}/member`,
    "",
    "If you have any questions, just reply to this email. Excited to see you all there!",
    "",
    "Best,",
    "Felisa",
    "felisa@commongroundcampus.com",
    "commongroundcampus.com",
    "",
    `You are receiving this because you are a Common Bridge member. Unsubscribe with one click: ${r.unsubscribeUrl}`,
  ].join("\n");

  return {
    id: "summit-2026-09",
    subject: "Common Bridge Summit, Sept 17: Disagreeing Without Disconnecting",
    html: shell("Common Bridge", "Disagreeing Without Disconnecting", lead, body, r.unsubscribeUrl),
    text,
  };
}

export const MEMBER_EMAILS: Record<string, (r: Recipient) => MemberEmail> = {
  "summit-2026-09": summitSeptember2026,
};

export type SendOutcome = { ok: true; status: string } | { ok: false; error: string };

/**
 * Record that these people agreed to hear from Common Bridge. The platform
 * holds marketing mail for any address without consent on file, so this runs
 * before every send. Members gave Felisa their addresses for exactly this;
 * the source string says so. Safe to repeat.
 */
export async function grantConsent(emails: string[], source: string): Promise<SendOutcome> {
  const key = process.env.RECURSIV_API_KEY;
  if (!key) return { ok: false, error: "RECURSIV_API_KEY is not set" };
  if (emails.length === 0) return { ok: true, status: "nothing to do" };

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 15000);
  try {
    const res = await fetch(`${ORIGIN}/api/v1/email/consents`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ emails, source }),
      signal: ac.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, error: `consent HTTP ${res.status} ${detail.slice(0, 200)}` };
    }
    return { ok: true, status: "granted" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}

/** Send one member email to one address. Never throws. */
export async function sendMemberEmail(to: string, mail: MemberEmail): Promise<SendOutcome> {
  const key = process.env.RECURSIV_API_KEY;
  if (!key) return { ok: false, error: "RECURSIV_API_KEY is not set" };

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 10000);
  try {
    const res = await fetch(`${ORIGIN}/api/v1/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        to,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        reply_to: "felisa@commongroundcampus.com",
        category: "marketing",
      }),
      signal: ac.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status} ${detail.slice(0, 200)}` };
    }
    const data = (await res.json().catch(() => ({}))) as {
      data?: { status?: string; messages?: { status?: string }[] };
    };
    // The endpoint answers 200 even when it holds the mail (no consent,
    // suppressed address). Only queued or sent counts as delivered to the queue.
    const status = data.data?.messages?.[0]?.status || data.data?.status || "unknown";
    if (!["queued", "sent", "retry"].includes(status)) {
      return { ok: false, error: `held by the platform: ${status}` };
    }
    return { ok: true, status };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}
