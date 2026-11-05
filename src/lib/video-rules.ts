/** Rules for ambassador video uploads. No imports, so tests can load it. */

/** Phones shoot big files. 2 GB covers several minutes of 4K. */
export const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;

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
 * The type we store the file as, or null when it is not a video or photo.
 * Some browsers send no type for .mov or .heic, so the extension decides then.
 */
export function videoType(filename: string, declared: string): string | null {
  const t = declared.toLowerCase().split(";")[0].trim();
  if (/^video\/[a-z0-9.+-]+$/.test(t)) return t;
  if (IMAGE_TYPES.has(t)) return t;
  const ext = filename.toLowerCase().split(".").pop() || "";
  if (!t || t === "application/octet-stream") return EXT_TYPES[ext] || null;
  return null;
}

/** A storage key that keeps the original name readable but can't be guessed. */
export function videoKey(filename: string, now = new Date(), rand = randomId()): string {
  const month = now.toISOString().slice(0, 7);
  const safe =
    filename
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "")
      .slice(-80) || "video";
  return `ambassadors/${month}/${rand}-${safe}`;
}

function randomId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

/* ---------- Rate limit: generous for a real ambassador, not for a script ---------- */

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 40;
const hits = new Map<string, number[]>();

export function uploadRateLimited(ip: string, now = Date.now()): boolean {
  if (!ip) return false;
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  }
  return recent.length > MAX_PER_WINDOW;
}

export function formatBytes(n: number): string {
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(1)} GB`;
  if (n >= 1024 ** 2) return `${Math.round(n / 1024 ** 2)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}
