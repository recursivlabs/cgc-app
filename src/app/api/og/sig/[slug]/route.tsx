import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * The certificate as a picture: 1200x630, the size link previews want.
 * iMessage and social apps show it when a signature link is shared, and
 * ?dl=1 turns the same picture into a download for "Save image".
 */

const GROUND = "#0a0a0c";
const PANEL = "#141413";
const INK = "#f5f4f0";
const INK_DIM = "#a5a3a0";
const INK_FAINT = "#6e6c68";
const BLUE = "#3aa6f5";

async function asset(...segments: string[]) {
  return readFile(path.join(process.cwd(), ...segments));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(slug)) {
    return new Response("Not found", { status: 404 });
  }

  const res = await query(
    `SELECT name, signature_number, created_at
     FROM declaration_signatures WHERE share_slug = $1`,
    [slug]
  );
  const row = res.rows[0];
  if (!row) return new Response("Not found", { status: 404 });

  const name: string = row.name;
  const number = Number(row.signature_number);
  const date = new Date(row.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const [anton, geist, geistSemi, logo] = await Promise.all([
    asset("src", "og-fonts", "Anton-Regular.ttf"),
    asset("src", "og-fonts", "Geist-Regular.otf"),
    asset("src", "og-fonts", "Geist-SemiBold.otf"),
    asset("public", "logo.png"),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  // Long names still fit on one card.
  const nameSize = name.length > 26 ? 56 : name.length > 18 ? 72 : 88;

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: GROUND,
          padding: 36,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            padding: 3,
            background: `linear-gradient(135deg, ${BLUE} 0%, #8b7cf8 52%, rgba(58,166,245,0.25) 100%)`,
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              background: PANEL,
              padding: "44px 56px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoSrc} width={44} height={44} alt="" />
                <div
                  style={{
                    display: "flex",
                    fontFamily: "Anton",
                    fontSize: 26,
                    color: INK,
                    letterSpacing: "0.02em",
                  }}
                >
                  <span>COMMON</span>
                  <span style={{ color: BLUE }}>GROUND</span>
                  <span>CAMPUS</span>
                </div>
              </div>
              <div
                style={{
                  fontFamily: "Anton",
                  fontSize: 58,
                  color: BLUE,
                }}
              >
                No. {number}
              </div>
            </div>

            <div
              style={{
                marginTop: 54,
                fontFamily: "GeistSemi",
                fontSize: 19,
                letterSpacing: "0.24em",
                color: BLUE,
              }}
            >
              HAS SIGNED
            </div>

            <div
              style={{
                marginTop: 14,
                fontFamily: "Anton",
                fontSize: nameSize,
                lineHeight: 0.98,
                color: INK,
                textTransform: "uppercase",
              }}
            >
              {name}
            </div>

            <div
              style={{
                marginTop: 22,
                fontFamily: "Geist",
                fontSize: 22,
                lineHeight: 1.45,
                color: INK_DIM,
                maxWidth: 760,
              }}
            >
              Signed in the belief that a free society rests on citizens with
              agency, character, and equal dignity.
            </div>

            <div
              style={{
                marginTop: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: `1px solid #2a2a2e`,
                paddingTop: 22,
                fontFamily: "GeistSemi",
                fontSize: 17,
                letterSpacing: "0.18em",
                color: INK_FAINT,
              }}
            >
              <div style={{ display: "flex" }}>THE PHILADELPHIA DECLARATION</div>
              <div style={{ display: "flex" }}>{date.toUpperCase()}</div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Anton", data: anton, style: "normal", weight: 400 },
        { name: "Geist", data: geist, style: "normal", weight: 400 },
        { name: "GeistSemi", data: geistSemi, style: "normal", weight: 600 },
      ],
    }
  );

  const headers = new Headers(image.headers);
  headers.set("Cache-Control", "public, max-age=3600");
  if (req.nextUrl.searchParams.get("dl") === "1") {
    headers.set(
      "Content-Disposition",
      `attachment; filename="philadelphia-declaration-no-${number}.png"`
    );
  }
  return new Response(image.body, { status: 200, headers });
}
