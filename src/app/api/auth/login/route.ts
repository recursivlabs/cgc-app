import { NextRequest, NextResponse } from "next/server";
import { anonSdk } from "@/lib/recursiv";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const session = await anonSdk.auth.signIn({ email, password });

    if (!session.token) {
      return NextResponse.json({ error: "Login succeeded but no session token received" }, { status: 500 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("cgc_session", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
