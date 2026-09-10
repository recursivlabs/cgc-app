import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

function page(title: string, text: string): NextResponse {
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | Common Ground Campus</title></head>
<body style="margin:0;background:#f5f4f0;font:400 17px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#141417;">
  <div style="max-width:520px;margin:12vh auto;padding:32px;background:#fff;border:1px solid #e4e2dd;">
    <p style="margin:0 0 12px;font:700 12px/1.4 inherit;letter-spacing:.14em;text-transform:uppercase;color:#3aa6f5;">Common Ground Campus</p>
    <h1 style="margin:0 0 12px;font-size:26px;line-height:1.3;">${title}</h1>
    <p style="margin:0;">${text}</p>
  </div>
</body></html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

/**
 * GET /unsubscribe?t=<token>
 * One click from the email footer. No sign-in, no confirmation step: the
 * token is the proof. We stop member emails for that address and say so.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t")?.trim();
  if (!token || token.length > 64) {
    return page("That link did not work", "Reply to any of our emails and we will take you off the list by hand.");
  }

  try {
    const res = await query(
      `UPDATE invited_members SET unsubscribed_at = COALESCE(unsubscribed_at, NOW())
        WHERE unsub_token = $1 RETURNING email`,
      [token]
    );
    const email = res.rows[0]?.email as string | undefined;
    if (!email) {
      return page("That link did not work", "Reply to any of our emails and we will take you off the list by hand.");
    }
    await query(`UPDATE members SET email_optin = false WHERE lower(email) = lower($1)`, [email]);
    return page("You are off the list", `We will not email ${email} again. Your Common Bridge membership stays as it is.`);
  } catch (error) {
    console.error("unsubscribe error", error);
    return page("Something went wrong", "Reply to any of our emails and we will take you off the list by hand.");
  }
}
