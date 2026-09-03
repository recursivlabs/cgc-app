import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { certificateImage } from "@/lib/certificate-image";

export const dynamic = "force-dynamic";

// The #BridgeBuilder certificate as a picture, for link previews and for the
// Save image button. Only the name, the number, and the date are shown; the
// member's email never leaves the database.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(slug)) {
    return new Response("Not found", { status: 404 });
  }

  const res = await query(
    `SELECT name, member_number, created_at FROM members WHERE share_slug = $1`,
    [slug]
  );
  const row = res.rows[0];
  if (!row) return new Response("Not found", { status: 404 });

  const number = Number(row.member_number);
  return certificateImage(
    {
      name: row.name,
      number,
      eyebrow: "#BridgeBuilder",
      line: "Somebody has to go first for anything good to happen. On this campus, that is you.",
      footerLeft: "Common Ground Campus",
      date: new Date(row.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    },
    {
      download: req.nextUrl.searchParams.get("dl") === "1",
      filename: `bridgebuilder-no-${number}.png`,
    }
  );
}
