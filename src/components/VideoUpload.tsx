"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Check, Upload, X } from "lucide-react";
import { HONEYPOT_FIELD } from "@/lib/spam";

type Status = "waiting" | "sending" | "done" | "failed";
interface Item {
  file: File;
  status: Status;
  progress: number;
  error?: string;
  id?: number;
}

const SAVED = "cgc-ambassador";

function sendOne(
  file: File,
  who: { name: string; email: string; note: string },
  extra: Record<string, string>,
  onProgress: (p: number) => void
): Promise<number> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", "/api/videos");
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.setRequestHeader("x-cgc-name", encodeURIComponent(who.name));
    xhr.setRequestHeader("x-cgc-email", encodeURIComponent(who.email));
    xhr.setRequestHeader("x-cgc-note", encodeURIComponent(who.note));
    xhr.setRequestHeader("x-cgc-filename", encodeURIComponent(file.name));
    xhr.setRequestHeader("x-cgc-size", String(file.size));
    for (const [k, v] of Object.entries(extra)) xhr.setRequestHeader(k, encodeURIComponent(v));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      let data: { id?: number; error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && data.id) resolve(data.id);
      else reject(new Error(data.error || "That upload didn't go through."));
    };
    xhr.onerror = () => reject(new Error("Connection dropped. Try again on Wi-Fi."));
    xhr.send(file);
  });
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

  function addFiles(list: FileList | null) {
    // Copy now: the picker is cleared right after, which empties the live list.
    const files = list ? Array.from(list) : [];
    if (!files.length) return;
    setFinished(0);
    setItems((cur) => [
      ...cur.filter((i) => i.status !== "done"),
      ...files.map((file) => ({ file, status: "waiting" as Status, progress: 0 })),
    ]);
  }

  function update(idx: number, patch: Partial<Item>) {
    setItems((cur) => cur.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!items.some((i) => i.status !== "done")) {
      setError("Choose at least one video or photo.");
      return;
    }
    setBusy(true);
    try {
      localStorage.setItem(SAVED, JSON.stringify({ name: who.name, email: who.email }));
    } catch {}

    const ids: number[] = [];
    const extra = {
      [`x-cgc-${HONEYPOT_FIELD}`]: honeypot,
      "x-cgc-elapsed": String(openedAt.current ? Date.now() - openedAt.current : ""),
    };
    for (let i = 0; i < items.length; i++) {
      if (items[i].status === "done") continue;
      update(i, { status: "sending", progress: 0, error: undefined });
      try {
        const id = await sendOne(items[i].file, who, extra, (p) => update(i, { progress: p }));
        ids.push(id);
        update(i, { status: "done", progress: 1, id });
      } catch (err) {
        update(i, { status: "failed", error: err instanceof Error ? err.message : "Failed" });
      }
    }

    if (ids.length) {
      await fetch("/api/videos/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: who.email, ids }),
      }).catch(() => {});
      setFinished(ids.length);
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
                  {it.status === "waiting" && !busy && (
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
