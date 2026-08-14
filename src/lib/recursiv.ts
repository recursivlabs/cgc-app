import { Recursiv } from "@recursiv/sdk";

let _recursiv: Recursiv | null = null;

export function getRecursiv(): Recursiv {
  if (!_recursiv) {
    _recursiv = new Recursiv({
      apiKey: process.env.RECURSIV_API_KEY!,
      baseUrl: process.env.NEXT_PUBLIC_RECURSIV_URL || "https://api.recursiv.io",
    });
  }
  return _recursiv;
}

/** Anonymous SDK instance for auth operations (no API key needed) */
export const anonSdk = new Recursiv({
  baseUrl: process.env.NEXT_PUBLIC_RECURSIV_URL || "https://api.recursiv.io/api/v1",
  anonymous: true,
});

const RECURSIV_ORIGIN = new URL(
  process.env.NEXT_PUBLIC_RECURSIV_URL || "https://api.recursiv.io"
).origin;

export interface PlatformSessionUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
}

/**
 * Read the current Better Auth session from a stored session token.
 *
 * We call get-session directly (instead of the SDK) and send the token under
 * BOTH the plain and the secure-prefixed cookie names. Production Better Auth
 * sets secure cookies as `__Secure-better-auth.session_token`, but the SDK's
 * getSession only sends the plain name, so the platform never found the cookie
 * and every session read came back empty. Sending all variants makes the read
 * work regardless of the platform's cookie configuration.
 */
export async function getPlatformSession(
  token: string
): Promise<PlatformSessionUser | null> {
  // Guard against a slow/unreachable platform hanging the session check (which
  // would leave the browser tab spinning). Abort after 6s and treat as logged out.
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 6000);
  try {
    const res = await fetch(`${RECURSIV_ORIGIN}/api/auth/get-session`, {
      method: "GET",
      headers: {
        Cookie: [
          `better-auth.session_token=${token}`,
          `__Secure-better-auth.session_token=${token}`,
          `__Host-better-auth.session_token=${token}`,
        ].join("; "),
      },
      cache: "no-store",
      signal: ac.signal,
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!data?.user?.id) return null;
    return data.user as PlatformSessionUser;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Alias for convenience
export const recursiv = new Proxy({} as Recursiv, {
  get(_, prop) {
    return (getRecursiv() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
