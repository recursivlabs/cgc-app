"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Check, Upload, X } from "lucide-react";
import { HONEYPOT_FIELD } from "@/lib/spam";
import { CHUNK_BYTES, MAX_VIDEO_BYTES, videoType } from "@/lib/video-rules";

/** failed = worth another try; rejected = this file will never be taken. */
type Status = "waiting" | "sending" | "done" | "failed" | "rejected";
interface Item {
  file: File;
  status: Status;
  progress: number;
  error?: string;
  /** A passing note while it works, e.g. "Resuming…". */
  info?: string;
}

const SAVED = "cgc-ambassador";

class UploadError extends Error {
  constructor(message: string, public final = false) {
    super(message);
  }
}

/** Why the browser can tell, before sending anything, that a file won't be taken. */
function precheck(file: File): string | null {
  if (!videoType(file.name, file.type)) return `${file.name} isn't a video or photo.`;
  if (file.size === 0) return `${file.name} is empty.`;
  if (file.size > MAX_VIDEO_BYTES) return `${file.name} is over 2 GB. Send a shorter clip.`;
  return null;
}

/** One piece, with upload progress. Resolves with the server's answer. */
function putPiece(
  url: string,
  blob: Blob,
  onProgress: (loaded: number) => void
): Promise<{ status: number; data: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.upload.onprogress = (e) => onProgress(e.loaded);
    xhr.onload = () => {
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      resolve({ status: xhr.status, data });
    };
    xhr.onerror = () => reject(new UploadError("Connection dropped."));
    xhr.ontimeout = () => reject(new UploadError("Connection timed out."));
    xhr.timeout = 4 * 60 * 1000;
    xhr.send(blob);
  });
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The session is gone (expired or dropped): start this file again. */
class Restart extends Error {}

type Who = { name: string; email: string; note: string };

/** Get an upload slot, waiting politely when the network or server is busy. */
async function startSession(
  file: File,
  who: Who,
  extra: Record<string, unknown>,
  onInfo: (msg: string) => void
): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    let status = 0;
    let data: Record<string, unknown> = {};
    try {
      const res = await fetch("/api/videos/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...who, ...extra, filename: file.name, size: file.size, type: file.type }),
      });
      status = res.status;
      data = await res.json().catch(() => ({}));
    } catch {
      status = 0;
    }
    if (status === 200 && typeof data.id === "string") {
      onInfo("");
      return data.id;
    }
    if (status >= 400 && status < 500 && status !== 429) {
      throw new UploadError(String(data.error || "That upload didn't start."), true);
    }
    // Busy (429/503), a server hiccup or no connection: wait our turn.
    if (attempt >= 30) throw new UploadError("Couldn't get through. Try again in a few minutes.");
    onInfo(status === 429 || status === 503 ? "Busy right now. Waiting for a turn…" : "Reconnecting…");
    await wait(Math.min(30000, 3000 * (attempt + 1)));
  }
}

/** The server already has the whole file; here is its answer. */
class AlreadyDone extends Error {
  constructor(public result: { id: number; token: string }) {
    super("done");
  }
}

/** Ask the server how far it got. */
async function whereAreWe(id: string): Promise<number> {
  const res = await fetch(`/api/videos/upload/${id}`, { cache: "no-store" });
  if (res.status === 410) throw new Restart();
  const d = await res.json().catch(() => ({}));
  if (res.ok && d.done) throw new AlreadyDone({ id: Number(d.id), token: String(d.token) });
  if (!res.ok || typeof d.received !== "number") throw new Error("status");
  return d.received;
}

/** Send the pieces; after any hiccup, resume from what the server has. */
async function sendPieces(
  file: File,
  id: string,
  onProgress: (p: number) => void,
  onInfo: (msg: string) => void
): Promise<{ id: number; token: string }> {
  let offset = 0;
  let misses = 0;
  while (true) {
    const end = Math.min(offset + CHUNK_BYTES, file.size);
    let res: { status: number; data: Record<string, unknown> } | null = null;
    try {
      res = await putPiece(`/api/videos/upload/${id}?offset=${offset}`, file.slice(offset, end), (loaded) =>
        onProgress(Math.min(1, (offset + loaded) / file.size))
      );
    } catch {
      res = null;
    }
    const d = res?.data || {};
    if (res?.status === 200 && d.done) {
      onInfo("");
      return { id: Number(d.id), token: String(d.token) };
    }
    if (res?.status === 200 && typeof d.received === "number") {
      offset = d.received;
      misses = 0;
      onInfo("");
      continue;
    }
    if (res && (res.status === 400 || res.status === 413 || res.status === 415)) {
      throw new UploadError(String(d.error || "That file can't be taken."), true);
    }
    if (res && (res.status === 408 || res.status === 410)) throw new Restart();
    if (res?.status === 409 && typeof d.received === "number") {
      offset = d.received;
      await wait(300);
      continue;
    }
    // Dropped connection, timeout or server hiccup: back off briefly (the
    // server keeps the upload for 30 s), then resume from its count.
    if (++misses > 10) throw new UploadError("The connection keeps dropping. Try again on Wi-Fi.");
    onInfo("Connection dropped. Resuming…");
    await wait(Math.min(8000, 1000 * misses));
    try {
      offset = await whereAreWe(id);
    } catch (err) {
      if (err instanceof AlreadyDone) return err.result;
      if (err instanceof Restart) throw err;
    }
  }
}

/**
 * Send one file in pieces, resuming after drops. If the server lost the
 * upload altogether, start the file again (a few times) without bothering
 * the person.
 */
async function sendOne(
  file: File,
  who: Who,
  extra: Record<string, unknown>,
  onProgress: (p: number) => void,
  onInfo: (msg: string) => void
): Promise<{ id: number; token: string }> {
  for (let attempt = 0; ; attempt++) {
    const id = await startSession(file, who, extra, onInfo);
    try {
      return await sendPieces(file, id, onProgress, onInfo);
    } catch (err) {
      if (!(err instanceof Restart)) throw err;
      if (attempt >= 3) throw new UploadError("That upload kept getting cut off. Try again on Wi-Fi.");
      onInfo("Starting this one again…");
      onProgress(0);
    }
  }
}

/** Pick videos or photos (or drag them in), send them, done. */
export default function VideoUpload() {
  const [who, setWho] = useState({ name: "", email: "", note: "" });
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(0);
  const [honeypot, setHoneypot] = useState("");
  const [dragging, setDragging] = useState(false);
  const openedAt = useRef(0);
  const picker = useRef<HTMLInputElement>(null);

  // Remember name and email so next month is one tap.
  useEffect(() => {
    openedAt.current = Date.now();
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED) || "{}");
      if (saved.name || saved.email) setWho((w) => ({ ...w, name: saved.name || "", email: saved.email || "" }));
    } catch {}
  }, []);

  // A file dropped beside the box would open in the tab and lose the form.
  useEffect(() => {
    const stop = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", stop);
    window.addEventListener("drop", stop);
    return () => {
      window.removeEventListener("dragover", stop);
      window.removeEventListener("drop", stop);
    };
  }, []);

  // Leaving mid-upload loses it, so ask first.
  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  function addFiles(list: FileList | null) {
    // Copy now: the picker is cleared right after, which empties the live list.
    const files = list ? Array.from(list) : [];
    if (!files.length) return;
    setFinished(0);
    setError("");
    setItems((cur) => [
      ...cur.filter((i) => i.status !== "done"),
      ...files.map((file) => {
        const why = precheck(file);
        return why
          ? { file, status: "rejected" as Status, progress: 0, error: why }
          : { file, status: "waiting" as Status, progress: 0 };
      }),
    ]);
  }

  function update(idx: number, patch: Partial<Item>) {
    setItems((cur) => cur.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const todo = items.filter((i) => i.status === "waiting" || i.status === "failed");
    if (!todo.length) {
      setError("Choose at least one video or photo.");
      return;
    }
    setBusy(true);
    try {
      localStorage.setItem(SAVED, JSON.stringify({ name: who.name, email: who.email }));
    } catch {}

    const sent: { id: number; token: string }[] = [];
    const extra = {
      [HONEYPOT_FIELD]: honeypot,
      elapsedMs: openedAt.current ? Date.now() - openedAt.current : null,
    };
    for (let i = 0; i < items.length; i++) {
      if (items[i].status !== "waiting" && items[i].status !== "failed") continue;
      update(i, { status: "sending", progress: 0, error: undefined });
      try {
        const r = await sendOne(items[i].file, who, extra, (p) => update(i, { progress: p }), (m) => update(i, { info: m }));
        sent.push(r);
        update(i, { status: "done", progress: 1, info: "" });
      } catch (err) {
        const final = err instanceof UploadError && err.final;
        update(i, {
          status: final ? "rejected" : "failed",
          info: "",
          error: err instanceof Error ? err.message : "Failed",
        });
      }
    }

    if (sent.length) {
      await fetch("/api/videos/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: sent }),
      }).catch(() => {});
      setFinished(sent.length);
      setWho((w) => ({ ...w, note: "" }));
    }
    setBusy(false);
  }

  const failed = items.filter((i) => i.status === "failed").length;

  return (
    <form onSubmit={send} className="card space-y-5 p-6 sm:p-8">
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="v-hp">Leave this empty</label>
        <input id="v-hp" name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off"
          value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="v-name" className="field-label">Your name</label>
          <input id="v-name" type="text" required maxLength={80} value={who.name} disabled={busy}
            onChange={(e) => setWho({ ...who, name: e.target.value })} className="input" placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="v-email" className="field-label">Email</label>
          <input id="v-email" type="email" required value={who.email} disabled={busy}
            onChange={(e) => setWho({ ...who, email: e.target.value })} className="input" placeholder="you@school.edu" />
        </div>
      </div>

      <div>
        <input ref={picker} type="file" accept="video/*,image/*" multiple className="hidden"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
        <button type="button" disabled={busy} onClick={() => picker.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (!busy) addFiles(e.dataTransfer.files); }}
          className={`flex w-full flex-col items-center justify-center gap-2 border border-dashed px-6 py-12 transition-colors hover:border-[var(--signal)] hover:text-[var(--ink)] disabled:opacity-50 ${
            dragging
              ? "border-[var(--signal)] bg-[rgba(58,166,245,0.08)] text-[var(--ink)]"
              : "border-[var(--line)] bg-[var(--panel)] text-[var(--ink-dim)]"
          }`}>
          <Upload className="h-6 w-6 text-[var(--signal)]" />
          <span className="text-[15px] font-semibold">Choose videos or photos</span>
          <span className="text-xs">Tap to pick from your phone, or drag files here. Raw is fine.</span>
        </button>
      </div>

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="border border-[var(--line)] px-4 py-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{it.file.name}</span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-[var(--ink-dim)]">
                  {it.status === "sending" && `${Math.round(it.progress * 100)}%`}
                  {it.status === "done" && <Check className="h-4 w-4 text-[var(--signal)]" />}
                  {(it.status === "waiting" || it.status === "failed" || it.status === "rejected") && !busy && (
                    <button type="button" aria-label={`Remove ${it.file.name}`}
                      onClick={() => setItems((cur) => cur.filter((_, j) => j !== i))}>
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </span>
              </div>
              {it.status === "sending" && (
                <div className="mt-2 h-1 bg-[var(--line)]">
                  <div className="h-1 bg-[var(--signal)] transition-all" style={{ width: `${it.progress * 100}%` }} />
                </div>
              )}
              {it.info && it.status === "sending" && (
                <p className="mt-2 text-xs text-[var(--ink-dim)]">{it.info}</p>
              )}
              {it.error && <p className="form-error mt-2">{it.error}</p>}
            </li>
          ))}
        </ul>
      )}

      <div>
        <label htmlFor="v-note" className="field-label">Anything we should know</label>
        <textarea id="v-note" rows={2} maxLength={500} value={who.note} disabled={busy}
          onChange={(e) => setWho({ ...who, note: e.target.value })} className="input resize-y"
          placeholder="Optional. Where you filmed, who's in it, this month's question." />
      </div>

      {error && <p className="form-error">{error}</p>}
      {finished > 0 && !busy && (
        <p className="text-[15px] text-[var(--ink)]">
          <Check className="mr-1 inline h-4 w-4 text-[var(--signal)]" />
          Got {finished === 1 ? "it" : `all ${finished}`}. Thank you.
          {failed > 0 && " Send again to retry the ones that failed."}
        </p>
      )}

      <button type="submit" disabled={busy}
        className="btn btn-signal w-full justify-center disabled:opacity-50">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : failed ? "Retry failed →" : "Send →"}
      </button>
      {busy && (
        <p className="text-center text-xs text-[var(--ink-dim)]">Keep this page open until it finishes.</p>
      )}
    </form>
  );
}
