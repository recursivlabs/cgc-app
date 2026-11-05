import { NextRequest, NextResponse } from "next/server";
import { HONEYPOT_FIELD, botReason } from "@/lib/spam";
import { MAX_VIDEO_BYTES, clientIp, startUpload, uploadRateLimited, videoType } from "@/lib/videos";

export const dynamic = "force-dynamic";

// POST /api/videos/upload - say who you are and what's coming; get an upload id
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim().slice(0, 80);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 200);
    const note = String(body.note || "").trim().slice(0, 500);
    const filename = String(body.filename || "").trim().slice(0, 200) || "file";
    const size = Number(body.size);
    const elapsed = Number(body.elapsedMs);

    if (name.length < 2) {
      return NextResponse.json({ error: "Please tell us your name." }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter your email." }, { status: 400 });
    }
    if (!videoType(filename, String(body.type || ""))) {
      return NextResponse.json({ error: `${filename} isn't a video or photo.` }, { status: 400 });
    }
    if (!Number.isInteger(size) || size <= 0) {
      return NextResponse.json({ error: "That file looks empty." }, { status: 400 });
    }
    if (size > MAX_VIDEO_BYTES) {
      return NextResponse.json({ error: `${filename} is over 2 GB. Send a shorter clip.` }, { status: 413 });
    }

    const ip = clientIp(req.headers.get("x-forwarded-for"));
    const reason = botReason({
      honeypot: String(body[HONEYPOT_FIELD] || ""),
      elapsedMs: Number.isFinite(elapsed) && elapsed >= 0 ? elapsed : null,
      fields: [name, note],
    });
    if (reason === "too-fast" || (!reason && uploadRateLimited(ip))) {
      return NextResponse.json({ error: "Please wait a moment and send again." }, { status: 429 });
    }
    if (reason) {
      console.warn("video: dropped", { reason, ip, email });
      return NextResponse.json({ error: "We couldn't take that upload." }, { status: 400 });
    }

    const started = startUpload({ name, email, note, filename, size, ip });
    if ("error" in started) {
      return NextResponse.json({ error: started.error }, { status: started.status });
    }
    return NextResponse.json({ id: started.id });
  } catch (error) {
    console.error("Video start error:", error);
    return NextResponse.json({ error: "That upload didn't start. Try again." }, { status: 500 });
  }
}
