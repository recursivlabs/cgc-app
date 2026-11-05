import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { canSeeVideos } from "@/lib/admin";
import { videoDownloadUrl } from "@/lib/videos";

export const dynamic = "force-dynamic";

const PASS_HEADERS = ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"];

/**
 * GET /api/videos/:id        - plays the file inline, from our own origin
 * GET /api/videos/:id?dl=1   - sends you to a short-lived download link
 *
 * Signed-in team only. Playback is proxied (with Range, so scrubbing works)
 * because the site's security policy only lets media load from itself.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || !canSeeVideos(user.email)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }
  const { id } = await ctx.params;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  try {
    const res = await query(`SELECT storage_key, content_type FROM video_uploads WHERE id = $1`, [n]);
    const row = res.rows[0] as { storage_key: string; content_type: string } | undefined;
    if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });

    const url = await videoDownloadUrl(row.storage_key);
    if (req.nextUrl.searchParams.get("dl")) return NextResponse.redirect(url, 302);

    const range = req.headers.get("range");
    const upstream = await fetch(url, {
      headers: range ? { Range: range } : {},
      cache: "no-store",
      signal: req.signal,
    });
    if (upstream.status === 416) {
      return new Response(null, {
        status: 416,
        headers: { "content-range": upstream.headers.get("content-range") || "bytes */*" },
      });
    }
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Couldn't open that file." }, { status: 502 });
    }
    const headers = new Headers();
    for (const h of PASS_HEADERS) {
      const v = upstream.headers.get(h);
      if (v) headers.set(h, v);
    }
    // Serve as the type we vetted at upload, never what storage says.
    headers.set("content-type", row.content_type);
    headers.set("content-disposition", "inline");
    headers.set("cache-control", "private, max-age=300");
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (error) {
    if ((error as Error)?.name === "AbortError") return new Response(null, { status: 499 });
    console.error("Video open error:", error);
    return NextResponse.json({ error: "Couldn't open that file." }, { status: 500 });
  }
}
