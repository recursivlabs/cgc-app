import { NextRequest, NextResponse } from "next/server";
import { getEvent } from "@/lib/events";
import { SITE_URL } from "@/lib/site";

/** GET /api/ics?event=<slug> - calendar file for an upcoming event. */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("event");
  const e = slug ? getEvent(slug) : undefined;
  if (!e || !e.date) {
    return NextResponse.json({ error: "Unknown event" }, { status: 404 });
  }

  const site = SITE_URL;
  const dt = e.date.replace(/-/g, "");
  const dayAfter = new Date(new Date(e.date + "T00:00:00Z").getTime() + 86400000)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");

  const utc = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const when = e.startsAt
    ? [
        `DTSTART:${utc(e.startsAt)}`,
        `DTEND:${utc(new Date(new Date(e.startsAt).getTime() + (e.durationMinutes ?? 60) * 60000).toISOString())}`,
      ]
    : [`DTSTART;VALUE=DATE:${dt}`, `DTEND;VALUE=DATE:${dayAfter}`];
  const esc = (s: string) => s.replace(/[,;]/g, "\\$&");
  const link = e.meetingUrl || `${site}/events/${e.slug}`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Common Ground Campus//Events//EN",
    "BEGIN:VEVENT",
    `UID:${e.slug}@commongroundcampus.com`,
    ...when,
    `SUMMARY:${esc(e.title)} | Common Ground Campus`,
    `DESCRIPTION:${esc(e.blurb)}${e.time ? `\\n${e.time}` : ""}${e.meetingUrl ? `\\nMeeting link: ${e.meetingUrl}` : ""}\\n${site}/events/${e.slug}`,
    `LOCATION:${e.meetingUrl ? e.meetingUrl : esc(e.campus)}`,
    `URL:${link}`,
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
