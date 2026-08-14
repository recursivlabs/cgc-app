import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPlatformSession } from "@/lib/recursiv";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cgc_session")?.value;

  // Logged-out is a normal state, not an error: return 200 with user:null so it
  // doesn't spam the browser console with 401 "Failed to load resource" errors.
  // Every caller already reads `data.user` (falsy => signed out).
  if (!token) {
    return NextResponse.json({ user: null, reason: "no_cookie" });
  }

  const user = await getPlatformSession(token);
  if (!user?.id) {
    return NextResponse.json({ user: null, reason: "invalid_session" });
  }

  
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name || "",
      email: user.email || "",
          },
  });
}
