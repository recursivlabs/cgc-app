import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { MEMBER_EMAIL_LIST } from "@/lib/member-email";
import { sendToAllMembers } from "@/lib/member-send";

export const dynamic = "force-dynamic";

/** Today's date in New York, as YYYY-MM-DD. Members and events are on ET. */
function todayInNewYork(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function keyMatches(given: string | null, expected: string): boolean {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * POST /api/cron/member-email
 *
 * Runs once a day. Sends any member email whose own `sendAt` date is today in
 * New York, and nothing else: an email with no date set is never sent from
 * here, only by a person pressing the button. The sends table means a repeat
 * run mails nobody twice.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "Scheduled sending is not configured." }, { status: 503 });
  }
  if (!keyMatches(req.headers.get("x-cron-key"), expected)) {
    return NextResponse.json({ error: "No." }, { status: 401 });
  }

  const today = todayInNewYork();
  const due = MEMBER_EMAIL_LIST.filter((t) => t.sendAt === today);
  if (due.length === 0) {
    return NextResponse.json({ date: today, due: 0, sent: 0 });
  }

  const results: { template: string; sent: number; failed: number; error?: string }[] = [];
  for (const t of due) {
    const out = await sendToAllMembers(t.id);
    results.push({ template: t.id, sent: out.sent, failed: out.failed.length, error: out.error });
    console.log("scheduled member email", t.id, out.sent, "sent,", out.failed.length, "failed", out.error || "");
  }

  const failedAny = results.some((r) => r.error || r.failed > 0);
  return NextResponse.json({ date: today, due: due.length, results }, { status: failedAny ? 502 : 200 });
}
