import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

// POST /api/member/claim - give a signed-in member their number and certificate
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    }

    const { name, emailOptin } = await req.json();
    const trimmed = typeof name === "string" ? name.trim() : "";
    if (trimmed.length < 2 || trimmed.length > 80) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO members (email, name, email_optin)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, email_optin = EXCLUDED.email_optin
       RETURNING member_number, name, created_at`,
      [user.email, trimmed, emailOptin !== false]
    );

    const row = res.rows[0];

    void notify({
      headline: "Someone became a #BridgeBuilder",
      subject: "a new #BridgeBuilder",
      replyTo: user.email,
      fields: [
        ["Name", row.name],
        ["Email", user.email],
        ["Member number", `No. ${row.member_number}`],
        ["Wants email updates", emailOptin !== false ? "Yes" : "No"],
      ],
    }).catch(() => {});

    return NextResponse.json({
      name: row.name,
      number: Number(row.member_number),
      date: new Date(row.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    });
  } catch (error) {
    console.error("Member claim error:", error);
    return NextResponse.json({ error: "We couldn't finish that. Try again." }, { status: 500 });
  }
}
