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
    // Each entry is an upload id plus the token the browser got back when that
    // file finished. Without the token nothing is announced.
    const items = (Array.isArray(body.items) ? body.items : [])
      .slice(0, 50)
      .map((i: { id?: unknown; token?: unknown }) => ({ id: Number(i?.id), token: String(i?.token || "") }))
      .filter((i: { id: number; token: string }) => Number.isInteger(i.id) && i.id > 0 && /^[0-9a-f]{24}$/.test(i.token));
    if (items.length === 0) return NextResponse.json({ success: true });

    const res = await query(
      `UPDATE video_uploads v SET notified = TRUE, notify_token = NULL
         FROM unnest($1::int[], $2::text[]) AS t(id, token)
        WHERE v.id = t.id AND v.notify_token = t.token AND v.notified = FALSE
          AND v.created_at > NOW() - INTERVAL '6 hours'
        RETURNING v.id, v.name, v.email, v.filename, v.size_bytes, v.note`,
      [items.map((i: { id: number }) => i.id), items.map((i: { token: string }) => i.token)]
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
