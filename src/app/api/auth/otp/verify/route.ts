import { NextResponse } from "next/server";

// Better Auth origin (same one the SDK derives from NEXT_PUBLIC_RECURSIV_URL).
const RECURSIV_ORIGIN = new URL(
  process.env.NEXT_PUBLIC_RECURSIV_URL || "https://api.recursiv.io"
).origin;

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    // We call Better Auth directly (instead of the SDK's verifyOtp) so we can
    // capture the SIGNED session token from the Set-Cookie header. The SDK
    // returns the unsigned body token, which Better Auth's get-session later
    // rejects (signature mismatch) - that is why sessions didn't persist and
    // users bounced back to /auth after entering a valid code.
    const res = await fetch(`${RECURSIV_ORIGIN}/api/auth/sign-in/email-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json().catch(() => ({} as Record<string, unknown>));

    if (!res.ok) {
      const errObj = (data as { error?: { message?: string }; message?: string }) || {};
      const message = errObj.error?.message || errObj.message || "Invalid or expired code";
      return NextResponse.json({ error: message }, { status: res.status === 403 ? 401 : res.status || 401 });
    }

    // Prefer the signed token from Set-Cookie; fall back to the body token.
    const headers = res.headers as Headers & { getSetCookie?: () => string[] };
    const setCookies = headers.getSetCookie
      ? headers.getSetCookie()
      : ([res.headers.get("set-cookie")].filter(Boolean) as string[]);

    let token: string | null = null;
    for (const c of setCookies) {
      const m = /better-auth\.session_token=([^;]+)/.exec(c);
      if (m) {
        token = m[1];
        break;
      }
    }

    const body = data as { session?: { token?: string }; token?: string; user?: { id: string; email: string; name: string } };
    const bodyToken = body.session?.token || body.token || null;
    const source = token ? "cookie" : bodyToken ? "body" : "none";
    if (!token) token = bodyToken;

    console.log(`OTP verify ok: token source=${source}`);

    if (!token) {
      return NextResponse.json(
        { error: "Verification succeeded but no session token received" },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: body.user ? { id: body.user.id, email: body.user.email, name: body.user.name } : null,
    });

    response.cookies.set("cgc_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
