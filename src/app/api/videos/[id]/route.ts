import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { canSeeVideos } from "@/lib/admin";
import { videoDownloadUrl } from "@/lib/videos";

export const dynamic = "force-dynamic";

// GET /api/videos/:id - signed-in team only; sends you to a short-lived download link
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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
    const res = await query(`SELECT storage_key FROM video_uploads WHERE id = $1`, [n]);
    const key = res.rows[0]?.storage_key as string | undefined;
    if (!key) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.redirect(await videoDownloadUrl(key), 302);
  } catch (error) {
    console.error("Video download error:", error);
    return NextResponse.json({ error: "Couldn't open that video." }, { status: 500 });
  }
}
