"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";

const TYPES = [
  "Bridging the Divide dialogue",
  "Bridge to Tomorrow service project",
  "Pop-up cinema",
  "US250 Tailgate Tour stop",
  "Not sure yet",
];

export default function HostForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    organization: "",
    location: "",
    eventType: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/host", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
      <div className="card p-8">
        <span className="mb-5 inline-flex h-11 w-11 items-center justify-center border border-[var(--signal)] bg-[rgba(58,166,245,0.1)] text-[var(--signal)]">
          <Check className="h-5 w-5" />
        </span>
        <h3 className="display text-2xl">Got it</h3>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--ink-dim)]">
          Felisa reads every one of these herself. She will come back to you at{" "}
          <span className="font-semibold text-[var(--ink)]">{form.email}</span>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="host-name" className="field-label">Your name</label>
          <input id="host-name" type="text" required maxLength={80} value={form.name}
            onChange={(e) => set("name", e.target.value)} className="input" placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="host-email" className="field-label">Email</label>
          <input id="host-email" type="email" required value={form.email}
            onChange={(e) => set("email", e.target.value)} className="input" placeholder="you@school.edu" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="host-org" className="field-label">School or organization</label>
          <input id="host-org" type="text" maxLength={120} value={form.organization}
            onChange={(e) => set("organization", e.target.value)} className="input" placeholder="Optional" />
        </div>
        <div>
          <label htmlFor="host-loc" className="field-label">City and state</label>
          <input id="host-loc" type="text" maxLength={120} value={form.location}
            onChange={(e) => set("location", e.target.value)} className="input" placeholder="Optional" />
        </div>
      </div>

      <div>
        <label htmlFor="host-type" className="field-label">What kind of event?</label>
        <select id="host-type" required value={form.eventType}
          onChange={(e) => set("eventType", e.target.value)} className="input">
          <option value="" disabled>Choose one</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="host-msg" className="field-label">Anything else</label>
        <textarea id="host-msg" rows={3} maxLength={800} value={form.message}
          onChange={(e) => set("message", e.target.value)} className="input resize-y"
          placeholder="A topic you want covered, a date you have in mind, anything." />
      </div>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={loading}
        className="btn btn-signal w-full justify-center disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send it →"}
      </button>
    </form>
  );
}
