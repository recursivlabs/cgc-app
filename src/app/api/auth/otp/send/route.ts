import { NextResponse } from "next/server";
import { PROJECT_ID } from "@/lib/constants";

const RECURSIV_ORIGIN = new URL(
  process.env.NEXT_PUBLIC_RECURSIV_URL || "https://api.recursiv.io"
).origin;

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Call the platform directly (not the anonymous SDK) so we can attach the
    // app-project header. Without it the platform cannot attribute the request
    // to this app and the OTP email goes out with platform (Recursiv) branding
    // instead of Spark AI. See otpEmailSurface.ts on the platform side.
    const res = await fetch(`${RECURSIV_ORIGIN}/api/auth/email-otp/send-verification-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-recursiv-app-project": PROJECT_ID,
      },
      body: JSON.stringify({ email, type: "sign-in" }),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("otp send failed", res.status, body.slice(0, 300));
      return NextResponse.json({ error: "Failed to send code" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
