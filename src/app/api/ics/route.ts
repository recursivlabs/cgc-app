import { NextRequest, NextResponse } from "next/server";
import { getEvent } from "@/lib/events";

/** GET /api/ics?event=<slug> — calendar file for an upcoming event. */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("event");
  const e = slug ? getEvent(slug) : undefined;
  if (!e || !e.date) {
    return NextResponse.json({ error: "Unknown event" }, { status: 404 });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://commongroundcampus.com";
  const dt = e.date.replace(/-/g, "");
  const dayAfter = new Date(new Date(e.date + "T00:00:00Z").getTime() + 86400000)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Common Ground Campus//Events//EN",
    "BEGIN:VEVENT",
    `UID:${e.slug}@commongroundcampus.com`,
    `DTSTART;VALUE=DATE:${dt}`,
    `DTEND;VALUE=DATE:${dayAfter}`,
    `SUMMARY:${e.title} — Common Ground Campus`,
    `DESCRIPTION:${e.blurb.replace(/[,;]/g, "\\$&")}${e.time ? `\\n${e.time}` : ""}\\n${site}/events/${e.slug}`,
    `LOCATION:${e.campus.replace(/,/g, "\\,")}`,
    `URL:${site}/events/${e.slug}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${e.slug}.ics"`,
    },
  });
}
