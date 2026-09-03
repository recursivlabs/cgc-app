"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Certificate from "@/components/Certificate";
import CertActions from "@/components/CertActions";

interface Claimed {
  name: string;
  number: number;
  date: string;
  slug?: string;
}

export default function ClaimForm({
  existing,
  initialName,
}: {
  existing: Claimed | null;
  initialName?: string | null;
}) {
  const [name, setName] = useState(initialName || "");
  const [optin, setOptin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [claimed, setClaimed] = useState<Claimed | null>(existing);

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/member/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, emailOptin: optin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "We couldn't finish that.");
      setClaimed(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (claimed) {
    return (
      <div className="max-w-2xl">
        <Certificate
          name={claimed.name}
          number={claimed.number}
          label="#BridgeBuilder"
          title="Common Ground Campus"
          line="Somebody has to go first for anything good to happen. On this campus, that is you."
          date={claimed.date}
        />
        {claimed.slug ? (
          <>
            <div className="mt-6">
              <CertActions
                imageHref={`/api/og/member/${claimed.slug}?dl=1`}
                sharePath={`/member/s/${claimed.slug}`}
                shareTitle={`${claimed.name} is a #BridgeBuilder`}
                shareText={`I am #BridgeBuilder No. ${claimed.number} at Common Ground Campus. Join me.`}
                downloadName={`bridgebuilder-no-${claimed.number}.png`}
              />
            </div>
            <p className="mt-5 text-sm leading-relaxed text-[var(--ink-dim)]">
              Anyone who opens your link sees your certificate and can join too.
            </p>
          </>
        ) : (
          <p className="mt-6 text-sm leading-relaxed text-[var(--ink-dim)]">
            Take a screenshot and send it to someone who should join too.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <p className="eyebrow mb-4">One more thing</p>
      <h2 className="display mb-4 text-2xl">What name goes on your certificate?</h2>
      <form onSubmit={handleClaim} className="space-y-5">
        <div>
          <label htmlFor="member-name" className="field-label">Your name</label>
          <input
            id="member-name"
            type="text"
            required
            autoFocus
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Your name"
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-[var(--ink-dim)]">
          <input
            type="checkbox"
            checked={optin}
            onChange={(e) => setOptin(e.target.checked)}
            className="mt-1 h-4 w-4 flex-none accent-[var(--signal)]"
          />
          <span>
            Email me when there is an event near me or something new to read. Nothing else.
          </span>
        </label>

        {error && <p className="form-error">{error}</p>}

        <button
          type="submit"
          disabled={loading || !name}
          className="btn btn-signal w-full justify-center disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get my certificate →"}
        </button>
      </form>
    </div>
  );
}
