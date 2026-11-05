import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { notify } from "@/lib/notify";
import { SITE_URL } from "@/lib/site";
import { formatBytes } from "@/lib/videos";

export const dynamic = "force-dynamic";

interface Row {
  id: number;
  name: string;
  email: string;
  filename: string;
  size_bytes: string;
  note: string | null;
}

// POST /api/videos/notify - after a batch, one email instead of one per file
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const ids = (Array.isArray(body.ids) ? body.ids : [])
      .map(Number)
      .filter((n: number) => Number.isInteger(n) && n > 0)
      .slice(0, 50);
    if (!email || ids.length === 0) return NextResponse.json({ success: true });

    // Only fresh, unannounced uploads from this sender, so this can't be used
    // to re-send or to email about someone else's files.
    const res = await query(
      `UPDATE video_uploads SET notified = TRUE
        WHERE id = ANY($1::int[]) AND email = $2 AND notified = FALSE
          AND created_at > NOW() - INTERVAL '6 hours'
        RETURNING id, name, email, filename, size_bytes, note`,
      [ids, email]
    );
    const rows = res.rows as Row[];
    if (rows.length === 0) return NextResponse.json({ success: true });

    const who = rows[0].name;
    const count = rows.length === 1 ? "a file" : `${rows.length} files`;
    void notify({
      headline: `${who} sent ${count}`,
      subject: `${who} sent ${count}`,
      replyTo: rows[0].email,
      link: `${SITE_URL}/admin/videos`,
      linkLabel: "Open the uploads",
      fields: [
        ["Ambassador", who],
        ["Email", rows[0].email],
        ...rows.map(
          (r, i) => [`File ${i + 1}`, `${r.filename} (${formatBytes(Number(r.size_bytes))})`] as [string, string]
        ),
      ],
      body: rows.find((r) => r.note)?.note || null,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Video notify error:", error);
    return NextResponse.json({ success: true });
  }
}
