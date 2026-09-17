import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { MEMBER_EMAIL_LIST } from "@/lib/member-email";
import { sendToAllMembers } from "@/lib/member-send";

export const dynamic = "force-dynamic";

/**
 * How long after its moment an email may still go out. The scheduler wakes on
 * the hour, so a send is always a little late; past this it is so late that
 * sending would be worse than not, and a template left in the list with an old
 * date can never surprise a member who joined months later.
 */
const GRACE_MS = 6 * 60 * 60 * 1000;

function keyMatches(given: string | null, expected: string): boolean {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * POST /api/cron/member-email
 *
 * Runs on a schedule. Sends any member email whose own moment has arrived and
 * has not long passed, and nothing else: an email with no date set is never
 * sent from here, only by a person pressing the button. The sends table means
 * a repeat run mails nobody twice.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "Scheduled sending is not configured." }, { status: 503 });
  }
  if (!keyMatches(req.headers.get("x-cron-key"), expected)) {
    return NextResponse.json({ error: "No." }, { status: 401 });
  }

  const now = Date.now();
  const due = MEMBER_EMAIL_LIST.filter((t) => {
    if (!t.sendAt) return false;
    const at = Date.parse(t.sendAt);
    return Number.isFinite(at) && now >= at && now < at + GRACE_MS;
  });
  if (due.length === 0) {
    return NextResponse.json({ now: new Date(now).toISOString(), due: 0, sent: 0 });
  }

  const results: { template: string; sent: number; failed: number; error?: string }[] = [];
  for (const t of due) {
    const out = await sendToAllMembers(t.id);
    results.push({ template: t.id, sent: out.sent, failed: out.failed.length, error: out.error });
    console.log("scheduled member email", t.id, out.sent, "sent,", out.failed.length, "failed", out.error || "");
  }

  const failedAny = results.some((r) => r.error || r.failed > 0);
  return NextResponse.json({ now: new Date(now).toISOString(), due: due.length, results }, { status: failedAny ? 502 : 200 });
}
