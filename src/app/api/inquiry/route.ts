import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getInquiry } from "@/lib/inquiries";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

// POST /api/inquiry - someone wants to hear from us
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const spec = getInquiry(String(body.kind || ""));
    if (!spec) {
      return NextResponse.json({ error: "Unknown form." }, { status: 400 });
    }

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const organization = String(body.organization || "").trim();
    const location = String(body.location || "").trim();
    const detail = String(body.detail || "").trim();
    const message = String(body.message || "").trim();
    const context = String(body.context || "").trim();

    if (name.length < 2) {
      return NextResponse.json({ error: "Please tell us your name." }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter an email we can reach you at." }, { status: 400 });
    }
    if (spec.detailOptions && !spec.detailOptions.includes(detail)) {
      return NextResponse.json({ error: "Please choose an option." }, { status: 400 });
    }

    await query(
      `INSERT INTO inquiries (kind, name, email, organization, location, detail, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        spec.kind,
        name,
        email,
        organization || null,
        location || null,
        detail || context || null,
        message || null,
      ]
    );

    const HEADLINE: Record<string, string> = {
      host: "Someone wants to host an event",
      nominate: "Someone nominated a school",
      partner: "Someone wants to mentor or partner",
      event: "Someone asked about an event",
    };

    void notify({
      headline: HEADLINE[spec.kind] || "Someone wrote in",
      subject: HEADLINE[spec.kind] || "a new message",
      replyTo: email,
      fields: [
        ["Name", name],
        ["Email", email],
        [spec.orgLabel || "Organization", organization],
        [spec.locationLabel || "Location", location],
        [spec.detailLabel || (context ? "Event" : "Detail"), detail || context],
      ],
      body: message,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Inquiry error:", error);
    return NextResponse.json({ error: "We couldn't send that. Try again." }, { status: 500 });
  }
}
