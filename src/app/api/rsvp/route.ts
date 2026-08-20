import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { getEvent } from "@/lib/events";

// POST /api/rsvp — RSVP the signed-in member for an event
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to RSVP" }, { status: 401 });
    }

    const { eventId } = await req.json();
    const event = eventId ? getEvent(eventId) : undefined;
    if (!event || !event.rsvp) {
      return NextResponse.json({ error: "This event does not take RSVPs" }, { status: 400 });
    }

    await query(
      `INSERT INTO rsvps (event_id, event_title, event_date, name, email)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (event_id, email) DO NOTHING`,
      [event.slug, event.title, event.date || null, user.name || null, user.email]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("RSVP error:", error);
    return NextResponse.json({ error: "We couldn't record that. Try again." }, { status: 500 });
  }
}
