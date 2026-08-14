import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRecursiv } from "@/lib/recursiv";

export async function POST() {
  // Invalidate the session server-side before clearing the cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("cgc_session")?.value;
  if (token) {
    try {
      const r = getRecursiv();
      await r.auth.signOut(token);
    } catch {
      // Non-fatal — we still clear the cookie below
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("cgc_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
