/**
 * Ambassador drop-off. Ambassadors send raw clips and photos from their phone;
 * the files land in project storage and the social team finds them in one feed
 * instead of digging through texts and email.
 *
 * How a file travels: the browser sends it in CHUNK_BYTES pieces, each its own
 * short request. The server holds one PUT to storage open per upload and feeds
 * each piece into it as it arrives, so nothing is buffered in memory or on
 * disk and no single request lives long enough to hit a proxy timeout. The
 * browser never talks to the storage host, so the site's security policy
 * stays "self only".
 */

import { request as httpsRequest } from "node:https";
import { request as httpRequest, type ClientRequest } from "node:http";
import { PassThrough } from "node:stream";
import { Recursiv } from "@recursiv/sdk";
import { PROJECT_ID } from "@/lib/constants";
import { MAX_VIDEO_BYTES, SNIFF_BYTES, randomId, sniffMedia, videoKey } from "@/lib/video-rules";

export const VIDEO_BUCKET = "ambassador-videos";

export {
  MAX_VIDEO_BYTES,
  CHUNK_BYTES,
  videoType,
  uploadRateLimited,
  clientIp,
  formatBytes,
} from "@/lib/video-rules";

/* ---------- Storage client ---------- */

let _client: Recursiv | null = null;

/**
 * Storage lives under /api/v1. NEXT_PUBLIC_RECURSIV_URL is set with and
 * without that suffix in different places, so take only its origin.
 */
function storage() {
  if (!_client) {
    const origin = new URL(process.env.NEXT_PUBLIC_RECURSIV_URL || "https://api.recursiv.io").origin;
    _client = new Recursiv({ apiKey: process.env.RECURSIV_API_KEY!, baseUrl: `${origin}/api/v1` });
  }
  return _client.storage;
}

let bucketReady = false;

async function ensureBucket(): Promise<void> {
  if (bucketReady) return;
  await storage().ensureBucket({ project_id: PROJECT_ID, name: VIDEO_BUCKET });
  bucketReady = true;
}

export async function videoDownloadUrl(key: string): Promise<string> {
  const { data } = await storage().getDownloadUrl({ project_id: PROJECT_ID, bucket_name: VIDEO_BUCKET, key });
  return data.url;
}

/* ---------- Upload sessions ---------- */

export interface UploadMeta {
  name: string;
  email: string;
  note: string;
  filename: string;
  size: number;
  ip: string;
}

interface Session {
  meta: UploadMeta;
  received: number;
  /** First bytes, kept until we know what the file is. */
  head: Buffer<ArrayBufferLike>;
  key?: string;
  contentType?: string;
  pass?: PassThrough;
  put?: ClientRequest;
  done?: Promise<void>;
  failed?: Error;
  busy: boolean;
  idle?: NodeJS.Timeout;
  startedAt: number;
  /** Stops the piece being read right now, if any. */
  cancel?: () => void;
}

/**
 * Slots are scarce, so an upload has to keep moving to keep one. No bytes for
 * IDLE_MS, or an average below MIN_BYTES_PER_SEC once past the grace period,
 * and it is dropped. A real phone on a weak connection clears this easily; a
 * script holding slots open with a byte at a time does not.
 */
const IDLE_MS = 30 * 1000;
const RATE_GRACE_MS = 60 * 1000;
const MIN_BYTES_PER_SEC = 20 * 1024;
const MAX_SESSIONS = 40;
/** Campus Wi-Fi puts a whole dorm behind one address. */
const MAX_SESSIONS_PER_IP = 6;

const sessions = new Map<string, Session>();

function drop(id: string, why: string) {
  const s = sessions.get(id);
  if (!s) return;
  sessions.delete(id);
  if (s.idle) clearTimeout(s.idle);
  s.put?.destroy(new Error(why));
  s.pass?.destroy();
  s.cancel?.();
}

function touch(id: string, s: Session) {
  if (s.idle) clearTimeout(s.idle);
  s.idle = setTimeout(() => drop(id, "idle"), IDLE_MS);
  s.idle.unref?.();
}

export type StartResult = { id: string } | { error: string; status: number };

export function startUpload(meta: UploadMeta): StartResult {
  if (meta.size <= 0 || meta.size > MAX_VIDEO_BYTES) return { error: "Bad size.", status: 400 };
  if (sessions.size >= MAX_SESSIONS) {
    return { error: "We're busy receiving other uploads. Try again in a minute.", status: 503 };
  }
  const mine = [...sessions.values()].filter((s) => s.meta.ip === meta.ip).length;
  if (mine >= MAX_SESSIONS_PER_IP) {
    return { error: "Lots of uploads from your network right now. Waiting for a turn.", status: 429 };
  }
  const id = randomId(24);
  const s: Session = { meta, received: 0, head: Buffer.alloc(0), busy: false, startedAt: Date.now() };
  sessions.set(id, s);
  touch(id, s);
  return { id };
}

/** Open the PUT to storage once we know what the file really is. */
async function openPut(s: Session): Promise<void> {
  await ensureBucket();
  const { data } = await storage().getUploadUrl({
    project_id: PROJECT_ID,
    bucket_name: VIDEO_BUCKET,
    key: s.key!,
    content_type: s.contentType!,
  });
  const pass = new PassThrough({ highWaterMark: 1024 * 1024 });
  const request = data.url.startsWith("http://") ? httpRequest : httpsRequest;
  s.pass = pass;
  s.done = new Promise<void>((resolve, reject) => {
    const put = request(
      data.url,
      {
        method: "PUT",
        headers: { "Content-Type": s.contentType!, "Content-Length": String(s.meta.size) },
      },
      (res) => {
        let detail = "";
        res.setEncoding("utf8");
        res.on("data", (c) => {
          if (detail.length < 500) detail += c;
        });
        res.on("end", () => {
          const status = res.statusCode || 0;
          if (status >= 200 && status < 300) resolve();
          else reject(new Error(`storage PUT ${status}: ${detail.slice(0, 300)}`));
        });
      }
    );
    put.on("error", reject);
    s.put = put;
    pass.pipe(put);
  });
  // Keep a failure around for the next piece to report, without crashing.
  s.done.catch((err) => {
    console.error("video: storage PUT failed", { key: s.key, received: s.received, err: String(err) });
    s.failed = err;
  });
}

function write(pass: PassThrough, buf: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    if (pass.destroyed) return reject(new Error("upload closed"));
    if (pass.write(buf)) return resolve();
    // A destroyed stream emits neither drain nor error, only close, so wait
    // on all three or a dropped upload would hang this request forever.
    const done = (err?: Error) => {
      pass.off("drain", onDrain);
      pass.off("error", onErr);
      pass.off("close", onClose);
      if (err) reject(err);
      else resolve();
    };
    const onDrain = () => done();
    const onErr = (e: Error) => done(e);
    const onClose = () => done(new Error("upload closed"));
    pass.once("drain", onDrain);
    pass.once("error", onErr);
    pass.once("close", onClose);
  });
}

/** Where an upload has got to, so a browser that lost track can resume. */
export function uploadStatus(id: string): { received: number } | null {
  const s = sessions.get(id);
  if (!s || s.failed) return null;
  return { received: s.received };
}

export type ChunkResult =
  | { received: number }
  | { complete: true; key: string; contentType: string; meta: UploadMeta }
  | { error: string; status: number; received?: number };

/**
 * Take the piece that starts at `offset`. If the browser and server disagree
 * about where we are (a piece died halfway), answer with what we have so the
 * browser resumes from there.
 */
export async function writeChunk(
  id: string,
  offset: number,
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal
): Promise<ChunkResult> {
  const s = sessions.get(id);
  if (!s) return { error: "That upload expired. Send it again.", status: 410 };
  if (s.failed) {
    drop(id, "failed");
    return { error: "Storage didn't accept that file. Send it again.", status: 502 };
  }
  if (s.busy) {
    // The browser gave up on the last piece and moved on; stop reading it.
    s.cancel?.();
    return { error: "Resume", status: 409, received: s.received };
  }
  if (offset !== s.received) return { error: "Resume", status: 409, received: s.received };

  s.busy = true;
  touch(id, s);
  try {
    // Read the web stream directly: a dropped connection then surfaces as a
    // rejected read we can catch, never as an uncaught stream error.
    const reader = body.getReader();
    const onAbort = () => reader.cancel().catch(() => {});
    s.cancel = onAbort;
    signal?.addEventListener("abort", onAbort, { once: true });
    try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      let buf: Buffer = Buffer.from(value);
      if (s.received + buf.length > s.meta.size) {
        drop(id, "too long");
        return { error: "That file is bigger than it said.", status: 400 };
      }
      if (!s.pass) {
        // Hold the first bytes until we can tell what the file is.
        s.head = Buffer.concat([s.head, buf]);
        s.received += buf.length;
        if (s.head.length < Math.min(SNIFF_BYTES, s.meta.size)) continue;
        const kind = sniffMedia(s.head);
        if (!kind) {
          drop(id, "not media");
          return { error: `${s.meta.filename} isn't a video or photo we can take.`, status: 415 };
        }
        s.key = videoKey(kind.ext);
        s.contentType = kind.type;
        await openPut(s);
        buf = s.head;
        s.head = Buffer.alloc(0);
        await write(s.pass!, buf);
      } else {
        await write(s.pass, buf);
        s.received += buf.length;
      }
      const elapsed = Date.now() - s.startedAt;
      if (elapsed > RATE_GRACE_MS && s.received / (elapsed / 1000) < MIN_BYTES_PER_SEC) {
        drop(id, "too slow");
        return { error: "The connection is too slow to finish. Try again on Wi-Fi.", status: 408 };
      }
      touch(id, s);
    }
    } finally {
      signal?.removeEventListener("abort", onAbort);
      s.cancel = undefined;
      try { reader.releaseLock(); } catch {}
    }
  } catch (err) {
    // A piece cut off halfway: what arrived is kept; the browser resumes.
    console.warn("video: piece interrupted", { id, received: s.received, err: String(err) });
    if (s.failed || !sessions.has(id)) {
      drop(id, "failed");
      return { error: "That upload didn't go through. Send it again.", status: 502 };
    }
    return { error: "Resume", status: 409, received: s.received };
  } finally {
    s.busy = false;
  }

  if (s.received < s.meta.size) return { received: s.received };

  // Whole file in. A file smaller than the sniff window lands here unsniffed.
  if (!s.pass) {
    const kind = sniffMedia(s.head);
    if (!kind) {
      drop(id, "not media");
      return { error: `${s.meta.filename} isn't a video or photo we can take.`, status: 415 };
    }
    s.key = videoKey(kind.ext);
    s.contentType = kind.type;
    await openPut(s);
    await write(s.pass!, s.head);
  }
  s.pass!.end();
  try {
    await s.done;
  } catch (err) {
    console.error("video: storage PUT failed", err);
    drop(id, "failed");
    return { error: "Storage didn't accept that file. Send it again.", status: 502 };
  }
  sessions.delete(id);
  if (s.idle) clearTimeout(s.idle);
  return { complete: true, key: s.key!, contentType: s.contentType!, meta: s.meta };
}
