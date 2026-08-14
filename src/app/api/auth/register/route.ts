import { NextResponse } from "next/server";
import { anonSdk } from "@/lib/recursiv";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const session = await anonSdk.auth.signUp({ name, email, password });

    const response = NextResponse.json({
      user: { id: session.user?.id, email, name },
    });

    if (session.token) {
      response.cookies.set("cgc_session", session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }


    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
