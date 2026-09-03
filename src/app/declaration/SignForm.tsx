"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Certificate from "@/components/Certificate";
import CertActions from "@/components/CertActions";

interface Signed {
  name: string;
  number: number;
  date: string;
  slug?: string;
}

export default function SignForm() {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signed, setSigned] = useState<Signed | null>(null);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/declaration")
      .then((r) => r.json())
      .then((d) => setCount(d.count))
      .catch(() => setCount(null));
  }, []);

  async function handleSign(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/declaration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, birthDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "We couldn't record that.");
      setSigned(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (signed) {
    return (
      <div>
        <p className="eyebrow mb-4">Signed</p>
        <h2 className="display mb-7 text-[clamp(1.8rem,4vw,2.8rem)]">
          You are signatory <span className="grad">No. {signed.number}</span>
        </h2>
        <Certificate
          name={signed.name}
          number={signed.number}
          label="Has signed"
          title="The Philadelphia Declaration"
          line="Signed in the belief that a free society rests on citizens with agency, character, and equal dignity."
          date={signed.date}
        />
        {signed.slug ? (
          <>
            <div className="mt-6">
              <CertActions
                imageHref={`/api/og/sig/${signed.slug}?dl=1`}
                sharePath={`/declaration/s/${signed.slug}`}
                shareTitle={`${signed.name} signed the Philadelphia Declaration`}
                shareText={`I am signatory No. ${signed.number}. Read it and add your name.`}
                downloadName={`philadelphia-declaration-no-${signed.number}.png`}
              />
            </div>
            <p className="mt-5 text-sm leading-relaxed text-[var(--ink-dim)]">
              Anyone who opens your link sees your certificate, reads the
              declaration, and can sign it too.
            </p>
          </>
        ) : (
          <p className="mt-6 text-sm leading-relaxed text-[var(--ink-dim)]">
            Take a screenshot and send it to someone who should sign too.
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      {count !== null && (
        <div className="mb-8">
          <p className="tally">{count.toLocaleString()}</p>
          <p className="mt-2 text-sm text-[var(--ink-dim)]">people have signed</p>
        </div>
      )}

      <p className="eyebrow mb-4">Add your name</p>
      <form onSubmit={handleSign} className="space-y-5">
        <div>
          <label htmlFor="sig-name" className="field-label">Full name</label>
          <input
            id="sig-name"
            type="text"
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="sig-dob" className="field-label">Date of birth</label>
          <input
            id="sig-dob"
            type="date"
            required
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="input"
          />
        </div>

        <p className="form-note">
          We ask for nothing else. No email, no phone number, no address.
        </p>

        {error && <p className="form-error">{error}</p>}

        <button
          type="submit"
          disabled={loading || !name || !birthDate}
          className="btn btn-signal w-full justify-center disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign the Declaration →"}
        </button>
      </form>
    </div>
  );
}
