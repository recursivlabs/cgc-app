import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";

/**
 * One certificate picture for every kind of certificate: 1200x630, the size
 * link previews want. The declaration and #BridgeBuilder OG routes both call
 * this with their own words.
 */

const GROUND = "#0a0a0c";
const PANEL = "#141413";
const INK = "#f5f4f0";
const INK_DIM = "#a5a3a0";
const INK_FAINT = "#6e6c68";
const BLUE = "#3aa6f5";

function asset(...segments: string[]) {
  return readFile(path.join(process.cwd(), ...segments));
}

export interface CertificateCard {
  name: string;
  number: number;
  eyebrow: string;
  line: string;
  footerLeft: string;
  date: string;
}

export async function certificateImage(
  card: CertificateCard,
  opts: { download?: boolean; filename?: string } = {}
): Promise<Response> {
  const [anton, geist, geistSemi, logo] = await Promise.all([
    asset("src", "og-fonts", "Anton-Regular.ttf"),
    asset("src", "og-fonts", "Geist-Regular.otf"),
    asset("src", "og-fonts", "Geist-SemiBold.otf"),
    asset("public", "logo.png"),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  // Long names still fit on one card.
  const nameSize = card.name.length > 26 ? 56 : card.name.length > 18 ? 72 : 88;

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
                  display: "flex",
                  fontFamily: "Anton",
                  fontSize: 58,
                  color: BLUE,
                }}
              >
                {`No. ${card.number}`}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 54,
                fontFamily: "GeistSemi",
                fontSize: 19,
                letterSpacing: "0.24em",
                color: BLUE,
              }}
            >
              {card.eyebrow.toUpperCase()}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 14,
                fontFamily: "Anton",
                fontSize: nameSize,
                lineHeight: 0.98,
                color: INK,
                textTransform: "uppercase",
              }}
            >
              {card.name}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 22,
                fontFamily: "Geist",
                fontSize: 22,
                lineHeight: 1.45,
                color: INK_DIM,
                maxWidth: 760,
              }}
            >
              {card.line}
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
              <div style={{ display: "flex" }}>{card.footerLeft.toUpperCase()}</div>
              <div style={{ display: "flex" }}>{card.date.toUpperCase()}</div>
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
  if (opts.download) {
    headers.set(
      "Content-Disposition",
      `attachment; filename="${opts.filename || `certificate-no-${card.number}.png`}"`
    );
  }
  return new Response(image.body, { status: 200, headers });
}
