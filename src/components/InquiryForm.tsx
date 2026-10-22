"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Loader2, Check } from "lucide-react";
import type { InquiryKind } from "@/lib/inquiries";
import { HONEYPOT_FIELD } from "@/lib/spam";

/** Cloudflare Turnstile shows only when this key is set at build time. */
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

/**
 * Every "get in touch" form on the site. The shape changes per kind, the
 * behaviour does not: we take it, store it, and tell you it landed.
 */
export default function InquiryForm({
  spec,
  context,
  compact,
}: {
  spec: InquiryKind;
  /** Extra text stored with the enquiry, e.g. which event it came from. */
  context?: string;
  compact?: boolean;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    organization: "",
    location: "",
    detail: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  // When the form appeared, so the server can tell a person from a script.
  const openedAt = useRef(0);
  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const turnstileToken = String(
      new FormData(e.currentTarget as HTMLFormElement).get("cf-turnstile-response") || ""
    );
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          kind: spec.kind,
          context,
          [HONEYPOT_FIELD]: honeypot,
          elapsedMs: openedAt.current ? Date.now() - openedAt.current : null,
          turnstileToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "We couldn't send that.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className={`card ${compact ? "p-6" : "p-8"}`}>
        <span className="mb-4 inline-flex h-10 w-10 items-center justify-center border border-[var(--signal)] bg-[rgba(58,166,245,0.1)] text-[var(--signal)]">
          <Check className="h-5 w-5" />
        </span>
        <h3 className="display text-xl">Got it</h3>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--ink-dim)]">
          {spec.done}{" "}
          <span className="font-semibold text-[var(--ink)]">{form.email}</span>
        </p>
      </div>
    );
  }

  const id = (f: string) => `${spec.kind}-${f}`;

  return (
    <form onSubmit={handleSubmit} className={`card space-y-5 ${compact ? "p-6" : "p-8"}`}>
      {/* Hidden from people and screen readers. Bots fill it in and get dropped. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor={id(HONEYPOT_FIELD)}>Leave this empty</label>
        <input id={id(HONEYPOT_FIELD)} name={HONEYPOT_FIELD} type="text" tabIndex={-1}
          autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={id("name")} className="field-label">Your name</label>
          <input id={id("name")} type="text" required maxLength={80} value={form.name}
            onChange={(e) => set("name", e.target.value)} className="input" placeholder="Your name" />
        </div>
        <div>
          <label htmlFor={id("email")} className="field-label">Email</label>
          <input id={id("email")} type="email" required value={form.email}
            onChange={(e) => set("email", e.target.value)} className="input" placeholder="you@school.edu" />
        </div>
      </div>

      {(spec.orgLabel || spec.locationLabel) && (
        <div className="grid gap-5 sm:grid-cols-2">
          {spec.orgLabel && (
            <div>
              <label htmlFor={id("org")} className="field-label">{spec.orgLabel}</label>
              <input id={id("org")} type="text" maxLength={120} value={form.organization}
                onChange={(e) => set("organization", e.target.value)} className="input" placeholder="Optional" />
            </div>
          )}
          {spec.locationLabel && (
            <div>
              <label htmlFor={id("loc")} className="field-label">{spec.locationLabel}</label>
              <input id={id("loc")} type="text" maxLength={120} value={form.location}
                onChange={(e) => set("location", e.target.value)} className="input" placeholder="Optional" />
            </div>
          )}
        </div>
      )}

      {spec.detailLabel && spec.detailOptions && (
        <div>
          <label htmlFor={id("detail")} className="field-label">{spec.detailLabel}</label>
          <select id={id("detail")} required value={form.detail}
            onChange={(e) => set("detail", e.target.value)} className="input">
            <option value="" disabled>Choose one</option>
            {spec.detailOptions.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}

      <div>
        <label htmlFor={id("msg")} className="field-label">{spec.messageLabel}</label>
        <textarea id={id("msg")} rows={3} maxLength={800} value={form.message}
          onChange={(e) => set("message", e.target.value)} className="input resize-y"
          placeholder={spec.messagePlaceholder} />
      </div>

      {TURNSTILE_SITE_KEY && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
          <div className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} data-theme="auto" />
        </>
      )}

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={loading}
        className="btn btn-signal w-full justify-center disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `${spec.submit} →`}
      </button>
    </form>
  );
}
