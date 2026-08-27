import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const TYPES = [
  "Bridging the Divide dialogue",
  "Bridge to Tomorrow service project",
  "Pop-up cinema",
  "US250 Tailgate Tour stop",
  "Not sure yet",
];

// POST /api/host - someone wants to bring an event to their campus
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const organization = String(body.organization || "").trim();
    const location = String(body.location || "").trim();
    const eventType = String(body.eventType || "").trim();
    const message = String(body.message || "").trim();

    if (name.length < 2) {
      return NextResponse.json({ error: "Please tell us your name." }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter an email we can reach you at." }, { status: 400 });
    }
    if (!TYPES.includes(eventType)) {
      return NextResponse.json({ error: "Please choose a type of event." }, { status: 400 });
    }

    await query(
      `INSERT INTO host_requests (name, email, organization, location, event_type, message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, email, organization || null, location || null, eventType, message || null]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Host request error:", error);
    return NextResponse.json({ error: "We couldn't send that. Try again." }, { status: 500 });
  }
}
