"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * Two buttons on the admin page: send yourself the email, then send it to
 * every member. The server skips anyone who already got it or unsubscribed.
 */
const PREVIEW_TO = "felisa@commongroundcampus.com";

export default function MemberEmailPanel({
  template,
  title,
  note: label,
  members,
  alreadySent,
}: {
  template: string;
  title: string;
  note: string;
  members: number;
  alreadySent: number;
}) {
  const [busy, setBusy] = useState<"test" | "preview" | "all" | null>(null);
  const [note, setNote] = useState("");
  const remaining = Math.max(members - alreadySent, 0);

  async function send(mode: "test" | "preview" | "all") {
    if (mode === "all" && !window.confirm(`Send "${title}" to ${remaining} members now?`)) return;
    setBusy(mode);
    setNote("");
    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          mode: mode === "preview" ? "test" : mode,
          ...(mode === "preview" ? { to: PREVIEW_TO } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNote(data.error || "Something went wrong.");
      } else if (mode === "test" || mode === "preview") {
        setNote(`Sent to ${data.to}.`);
      } else {
        setNote(
          `Sent to ${data.sent} members.` +
            (data.failed?.length ? ` ${data.failed.length} failed. Press again to retry them.` : "")
        );
      }
    } catch {
      setNote("Could not reach the server.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="border border-[var(--line)] bg-[var(--panel)] p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-dim)]">{label}</p>
      <p className="display mt-2 text-xl">{title}</p>
      <p className="mt-2 text-[15px] text-[var(--ink-dim)]">
        {members} members can receive email. {alreadySent} already received this one.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => send("test")}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 border border-[var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[var(--ink)] disabled:opacity-50"
        >
          {busy === "test" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Send me a test
        </button>
        <button
          type="button"
          onClick={() => send("preview")}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 border border-[var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[var(--ink)] disabled:opacity-50"
        >
          {busy === "preview" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Send Felisa a preview
        </button>
        <button
          type="button"
          onClick={() => send("all")}
          disabled={busy !== null || remaining <= 0}
          className="inline-flex items-center gap-2 bg-[var(--signal)] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#141417] disabled:opacity-50"
        >
          {busy === "all" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Send to all members
        </button>
      </div>
      {note && <p className="mt-4 text-[15px] text-[var(--ink)]">{note}</p>}
    </div>
  );
}
