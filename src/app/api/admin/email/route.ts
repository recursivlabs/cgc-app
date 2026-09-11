import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { adminEmails, isAdmin } from "@/lib/admin";
import { MEMBER_EMAILS } from "@/lib/member-email";
import { sendOne, sendToAllMembers } from "@/lib/member-send";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/email
 * { template: "summit-2026-09", mode: "test" | "all", to?: string }
 *
 * "test" sends one copy: to the signed-in admin, or to another person on the
 * admin list when `to` says so.
 * "all" sends to every member who has an address, has not unsubscribed, and
 * has not already had this one, so the button is safe to press twice.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Admins only." }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { template?: string; mode?: string; to?: string };
  const templateId = body.template;
  if (!templateId || !MEMBER_EMAILS[templateId]) {
    return NextResponse.json({ error: "Unknown email." }, { status: 400 });
  }

  if (body.mode === "test") {
    // A preview can go to the signed-in admin or to one of the other people
    // already trusted with the inbox. Nowhere else: this is not a way to mail
    // an arbitrary address from the organization.
    const requested = body.to?.trim().toLowerCase();
    if (requested && !adminEmails().includes(requested)) {
      return NextResponse.json({ error: "Previews only go to the people on the admin list." }, { status: 400 });
    }
    const to = requested || user.email;
    const out = await sendOne(templateId, to);
    return NextResponse.json(out.error ? { error: out.error } : { sent: out.sent, to }, {
      status: out.error ? 502 : 200,
    });
  }

  if (body.mode !== "all") {
    return NextResponse.json({ error: "mode must be test or all." }, { status: 400 });
  }

  const out = await sendToAllMembers(templateId);
  return NextResponse.json(out.error ? { error: out.error } : { sent: out.sent, failed: out.failed }, {
    status: out.error ? 502 : 200,
  });
}
