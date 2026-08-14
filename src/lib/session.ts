import { cookies } from "next/headers";
import { getPlatformSession } from "./recursiv";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

/** Get the current user from the session cookie (server-side only). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("cgc_session")?.value;
  if (!token) return null;

  const user = await getPlatformSession(token);
  if (!user?.id) return null;

  return { id: user.id, name: user.name || "", email: user.email || "" };
}
