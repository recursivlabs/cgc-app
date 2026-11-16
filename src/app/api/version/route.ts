import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET /api/version - which build is live (Coolify sets SOURCE_COMMIT). */
export function GET() {
  return NextResponse.json({ commit: process.env.SOURCE_COMMIT || "unknown", fix: "consent-nonblocking" });
}
