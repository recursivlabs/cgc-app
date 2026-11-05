import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { HONEYPOT_FIELD, botReason } from "@/lib/spam";
import { MAX_VIDEO_BYTES, putVideo, uploadRateLimited, videoKey, videoType } from "@/lib/videos";

export const dynamic = "force-dynamic";

function header(req: NextRequest, name: string): string {
  try {
    return decodeURIComponent(req.headers.get(name) || "").trim();
  } catch {
    return "";
  }
}

// PUT /api/videos - one video or photo as the raw body; who sent it in x-cgc-* headers
export async function PUT(req: NextRequest) {
  try {
    const name = header(req, "x-cgc-name").slice(0, 80);
    const email = header(req, "x-cgc-email").slice(0, 200);
    const note = header(req, "x-cgc-note").slice(0, 500);
    const filename = header(req, "x-cgc-filename").slice(0, 200) || "video";
    const size = Number(req.headers.get("x-cgc-size"));
    const elapsed = Number(req.headers.get("x-cgc-elapsed"));

    if (name.length < 2) {
      return NextResponse.json({ error: "Please tell us your name." }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter your email." }, { status: 400 });
    }
    const contentType = videoType(filename, req.headers.get("content-type") || "");
    if (!contentType) {
      return NextResponse.json({ error: `${filename} isn't a video or photo.` }, { status: 400 });
    }
    if (!Number.isInteger(size) || size <= 0) {
      return NextResponse.json({ error: "That file looks empty." }, { status: 400 });
    }
    if (size > MAX_VIDEO_BYTES) {
      return NextResponse.json(
        { error: `${filename} is over 2 GB. Trim it or send a shorter clip.` },
        { status: 413 }
      );
    }
    const declared = Number(req.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > 0 && declared !== size) {
      return NextResponse.json({ error: "The upload was cut short. Try again." }, { status: 400 });
    }
    if (!req.body) {
      return NextResponse.json({ error: "No file came through." }, { status: 400 });
    }

    const forwarded = (req.headers.get("x-forwarded-for") || "").split(",");
    const ip = (req.headers.get("cf-connecting-ip") || forwarded[forwarded.length - 1] || "").trim();
    const reason = botReason({
      honeypot: header(req, `x-cgc-${HONEYPOT_FIELD}`),
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

    const key = videoKey(filename);
    await putVideo(key, contentType, size, req.body);

    const res = await query(
      `INSERT INTO video_uploads (name, email, filename, storage_key, content_type, size_bytes, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [name, email.toLowerCase(), filename, key, contentType, size, note || null]
    );
    console.info("video: stored", { id: res.rows[0].id, size, email });
    return NextResponse.json({ id: res.rows[0].id });
  } catch (error) {
    console.error("Video upload error:", error);
    return NextResponse.json({ error: "That upload didn't go through. Try again." }, { status: 500 });
  }
}
