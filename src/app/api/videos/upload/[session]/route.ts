import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { finishedResult, rememberFinished, uploadStatus, writeChunk } from "@/lib/videos";
import { randomId } from "@/lib/video-rules";

export const dynamic = "force-dynamic";

// GET /api/videos/upload/:session - how many bytes have arrived, to resume from
export async function GET(_req: NextRequest, ctx: { params: Promise<{ session: string }> }) {
  const { session } = await ctx.params;
  const st = /^[0-9a-f]{24}$/.test(session) ? uploadStatus(session) : null;
  if (!st) return NextResponse.json({ error: "That upload expired." }, { status: 410 });
  return NextResponse.json(st);
}

// PUT /api/videos/upload/:session?offset=N - one piece of the file
export async function PUT(req: NextRequest, ctx: { params: Promise<{ session: string }> }) {
  const { session } = await ctx.params;
  const offset = Number(req.nextUrl.searchParams.get("offset"));
  if (!/^[0-9a-f]{24}$/.test(session) || !Number.isInteger(offset) || offset < 0 || !req.body) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const already = finishedResult(session);
  if (already) return NextResponse.json({ done: true, ...already });
  try {
    const r = await writeChunk(session, offset, req.body, req.signal);
    if ("error" in r) {
      return NextResponse.json({ error: r.error, received: r.received }, { status: r.status });
    }
    if (!("complete" in r)) return NextResponse.json({ received: r.received });

    // The token proves to /notify that this browser really sent this file.
    const token = randomId(24);
    const m = r.meta;
    const res = await query(
      `INSERT INTO video_uploads
         (name, email, filename, storage_key, content_type, size_bytes, note, notify_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [m.name, m.email, m.filename, r.key, r.contentType, m.size, m.note || null, token]
    );
    console.info("video: stored", { id: res.rows[0].id, size: m.size, type: r.contentType });
    rememberFinished(session, { id: res.rows[0].id, token });
    return NextResponse.json({ done: true, id: res.rows[0].id, token });
  } catch (error) {
    console.error("Video piece error:", error);
    return NextResponse.json({ error: "That upload didn't go through. Try again." }, { status: 500 });
  }
}
