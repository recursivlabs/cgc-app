/**
 * Keep form bots out of Felisa's inbox without losing real people.
 *
 * Every check here is cheap and runs on the server. A submission that fails
 * one gets a normal "Got it" reply but is never stored or emailed, so a bot
 * learns nothing from the response.
 */

/** A human needs at least this long to read and fill in the form. */
export const MIN_FILL_MS = 3000;

/** Longer than this and the number was made up, not measured. */
export const MAX_FILL_MS = 7 * 24 * 60 * 60 * 1000;

/** The hidden field real people never see. Bots fill every input they find. */
export const HONEYPOT_FIELD = "website";

/**
 * True for one word that looks typed by a random generator, such as
 * "vLxoHCWkPhZswWxebaLi": long, with capitals scattered and stacked through
 * it. Real names like "McDonald", "DeShawn", "O'Brien", "UCLA" or
 * "StudentsForDialogue", "NYUStern" pass. We judge case,
 * not spelling, so Polish, Welsh or German names are never at risk.
 */
export function looksRandomWord(word: string): boolean {
  if (word.length < 8 || !/^[A-Za-z]+$/.test(word)) return false;
  const innerCaps = (word.slice(1).match(/[A-Z]/g) || []).length;
  const lower = (word.match(/[a-z]/g) || []).length;
  // CamelCase names (StudentsForDialogue) never stack capitals mid-word;
  // generated strings almost always do (HCW, LLM).
  if (innerCaps < 3 || lower < 3 || !/[A-Z]{2}/.test(word.slice(1))) return false;
  // Acronym-led names (NYUStern, UCSanDiego, MITMediaLab) switch from lower
  // to upper case once at most; generated strings do it three or more times.
  return (word.match(/[a-z][A-Z]/g) || []).length >= 3;
}

/** True when any word in a field looks random. */
export function looksRandom(value: string | null | undefined): boolean {
  if (!value) return false;
  return value
    .split(/\s+/)
    .map((w) => w.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, ""))
    .some(looksRandomWord);
}

/**
 * Gibberish needs two or more free-text fields to look random, so a single
 * odd name or typo never costs us a real submission.
 */
export function isGibberish(fields: (string | null | undefined)[]): boolean {
  return fields.filter(looksRandom).length >= 2;
}

/** Why a submission looks like a bot, or null when it looks human. */
export function botReason(input: {
  honeypot: string;
  /** How long the form was open, measured in the browser (no clock skew). */
  elapsedMs: number | null;
  fields: (string | null | undefined)[];
}): string | null {
  if (input.honeypot.trim()) return "honeypot";
  if (input.elapsedMs === null) return "no-timer";
  if (input.elapsedMs < MIN_FILL_MS) return "too-fast";
  if (input.elapsedMs > MAX_FILL_MS) return "bad-timer";
  if (isGibberish(input.fields)) return "gibberish";
  return null;
}

/* ---------- Rate limit: a few per address, in memory ---------- */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

/** True when this address has sent too many forms in the last ten minutes. */
export function rateLimited(ip: string, now = Date.now()): boolean {
  if (!ip) return false;
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
    }
  }
  return recent.length > MAX_PER_WINDOW;
}

/* ---------- Cloudflare Turnstile, only when keys are set ---------- */

/**
 * Checks a Turnstile token with Cloudflare. Returns true when Turnstile is
 * not configured, so the form keeps working until the keys are added.
 */
export async function turnstileOk(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    // Cloudflare down should not silence real people.
    console.error("turnstile: verify failed, letting it through", error);
    return true;
  }
}
