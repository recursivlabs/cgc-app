"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Check } from "lucide-react";

export default function RsvpButton(props: { eventId: string }) {
  return (
    <Suspense fallback={<span className="btn btn-signal opacity-50">RSVP</span>}>
      <RsvpInner {...props} />
    </Suspense>
  );
}

function RsvpInner({ eventId }: { eventId: string }) {
  const storageKey = `rsvp_${eventId}`;
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [user, setUser] = useState<{ email: string } | null | undefined>(undefined);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(storageKey)) setState("done");
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d?.user || null))
      .catch(() => setUser(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRsvp() {
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "We couldn't record that. Try again.");
      }
      localStorage.setItem(storageKey, "1");
      setState("done");
    } catch (e) {
      setState("idle");
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  // Auto-RSVP when returning from signup with ?rsvp=<eventId>
  useEffect(() => {
    if (user && state === "idle" && searchParams.get("rsvp") === eventId) handleRsvp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (state === "done") {
    return (
      <span className="btn btn-ghost !cursor-default">
        <Check className="h-4 w-4 text-[var(--signal)]" /> You&apos;re in. See you there
      </span>
    );
  }

  if (user === null) {
    const returnTo = encodeURIComponent(`/events/${eventId}?rsvp=${eventId}`);
    return (
      <Link href={`/auth?returnTo=${returnTo}`} className="btn btn-signal">
        Sign in to RSVP →
      </Link>
    );
  }

  return (
    <span className="inline-flex flex-col gap-2">
      <button
        type="button"
        onClick={handleRsvp}
        disabled={state === "loading" || user === undefined}
        className="btn btn-signal disabled:opacity-60"
      >
        {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save my spot"}
      </button>
      {error && <span className="text-xs text-[var(--signal)]">{error}</span>}
    </span>
  );
}
