/**
 * Rules for ambassador uploads. No imports, so tests and the browser can both
 * load it.
 */

/** Phones shoot big files. 2 GB covers several minutes of 4K. */
export const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;

/**
 * Files travel in pieces this big. Each piece is its own short request, so a
 * slow uplink never trips a proxy or server timeout, and a dropped connection
 * resumes from the last piece instead of starting over.
 */
export const CHUNK_BYTES = 8 * 1024 * 1024;

const EXT_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/x-m4v",
  mov: "video/quicktime",
  webm: "video/webm",
  avi: "video/x-msvideo",
  mkv: "video/x-matroska",
  "3gp": "video/3gpp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  heic: "image/heic",
  heif: "image/heif",
  gif: "image/gif",
  webp: "image/webp",
};

/** Photo types we take. SVG is left out on purpose: it can carry script. */
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/heic", "image/heif", "image/gif", "image/webp"]);

/**
 * A first look at what the browser says the file is, so obvious mistakes
 * (a PDF, a document) are refused before any bytes move. The bytes decide
 * the stored type later; see sniffMedia.
 */
export function videoType(filename: string, declared: string): string | null {
  const t = declared.toLowerCase().split(";")[0].trim();
  const ext = filename.toLowerCase().split(".").pop() || "";
  if (/^video\/[a-z0-9.+-]+$/.test(t)) return t;
  if (IMAGE_TYPES.has(t)) return t;
  if (!t || t === "application/octet-stream") return EXT_TYPES[ext] || null;
  return null;
}

export interface Sniffed {
  type: string;
  ext: string;
}

/** Bytes needed to recognise every format below. */
export const SNIFF_BYTES = 64;

function ascii(b: Uint8Array, from: number, to: number): string {
  let s = "";
  for (let i = from; i < Math.min(to, b.length); i++) s += String.fromCharCode(b[i]);
  return s;
}

/**
 * What the file really is, from its first bytes, or null when it is not a
 * video or photo we take. The label the browser sent is never trusted.
 */
export function sniffMedia(b: Uint8Array): Sniffed | null {
  if (b.length < 12) return null;
  const box = ascii(b, 4, 8);
  if (box === "ftyp") {
    const brand = ascii(b, 8, 12);
    if (brand === "qt  ") return { type: "video/quicktime", ext: "mov" };
    if (["heic", "heix", "hevc", "heim", "heis", "hevx"].includes(brand)) return { type: "image/heic", ext: "heic" };
    if (["mif1", "msf1", "avif"].includes(brand)) return { type: "image/heif", ext: "heif" };
    if (brand.startsWith("3g")) return { type: "video/3gpp", ext: "3gp" };
    if (brand === "M4V ") return { type: "video/x-m4v", ext: "m4v" };
    return { type: "video/mp4", ext: "mp4" };
  }
  // Older QuickTime files start straight with a movie box.
  if (["moov", "mdat", "wide", "free", "skip", "pnot"].includes(box)) {
    return { type: "video/quicktime", ext: "mov" };
  }
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) {
    return ascii(b, 0, SNIFF_BYTES).includes("webm")
      ? { type: "video/webm", ext: "webm" }
      : { type: "video/x-matroska", ext: "mkv" };
  }
  if (ascii(b, 0, 4) === "RIFF") {
    const form = ascii(b, 8, 12);
    if (form === "AVI ") return { type: "video/x-msvideo", ext: "avi" };
    if (form === "WEBP") return { type: "image/webp", ext: "webp" };
    return null;
  }
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { type: "image/jpeg", ext: "jpg" };
  if (b[0] === 0x89 && ascii(b, 1, 8) === "PNG\r\n\x1a\n") return { type: "image/png", ext: "png" };
  if (ascii(b, 0, 6) === "GIF87a" || ascii(b, 0, 6) === "GIF89a") return { type: "image/gif", ext: "gif" };
  return null;
}

/** A storage key nobody can guess. The original name stays in the database only. */
export function videoKey(ext: string, now = new Date(), rand = randomId()): string {
  const month = now.toISOString().slice(0, 7);
  const safeExt = /^[a-z0-9]{2,5}$/.test(ext) ? ext : "bin";
  return `ambassadors/${month}/${rand}.${safeExt}`;
}

export function randomId(n = 12): string {
  let s = "";
  while (s.length < n) s += crypto.randomUUID().replace(/-/g, "");
  return s.slice(0, n);
}

/**
 * The caller's address. Our proxy appends the real client last, and anything
 * before it (or a cf-connecting-ip header) is whatever the client chose to
 * send, so only the last hop counts.
 */
export function clientIp(forwardedFor: string | null): string {
  const hops = (forwardedFor || "").split(",").map((s) => s.trim()).filter(Boolean);
  return hops[hops.length - 1] || "";
}

/* ---------- Rate limit: generous for a real ambassador, not for a script ---------- */

const WINDOW_MS = 60 * 60 * 1000;
// Campus Wi-Fi puts many students behind one address, so leave headroom.
const MAX_PER_WINDOW = 120;
const hits = new Map<string, number[]>();

export function uploadRateLimited(ip: string, now = Date.now()): boolean {
  const k = ip || "unknown";
  const recent = (hits.get(k) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(k, recent);
  if (hits.size > 5000) {
    for (const [key, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(key);
  }
  return recent.length > MAX_PER_WINDOW;
}

export function formatBytes(n: number): string {
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(1)} GB`;
  if (n >= 1024 ** 2) return `${Math.round(n / 1024 ** 2)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}
