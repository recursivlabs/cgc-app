"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  return (
    <Suspense>
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "We couldn't send the code. Try again.");
      }
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "That code didn't match. Try again.");
      }
      window.location.href = returnTo || "/member";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex min-h-svh items-center justify-center px-5 py-28">
      <div className="w-full max-w-md">
        <p className="eyebrow mb-4 text-center">#BridgeBuilders</p>
        <h1 className="display text-center text-4xl">
          {step === "email" ? "Sign in or join" : "Check your email"}
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-[var(--ink-dim)]">
          {step === "email"
            ? "New or returning, just enter your email. No password, we send you a code."
            : `We sent a 6-digit code to ${email}`}
        </p>

        {step === "email" ? (
          <form onSubmit={handleSendCode} className="mt-8 space-y-3">
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@school.edu"
              aria-label="Email address"
            />
            {error && (
              <p className="border border-[var(--signal)] bg-[rgba(255,77,46,0.08)] px-3 py-2 text-xs text-[var(--signal)]">
                {error}
              </p>
            )}
            <button type="submit" disabled={loading} className="btn btn-signal w-full justify-center disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue →"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="mt-8 space-y-3">
            <input
              type="text"
              required
              autoFocus
              maxLength={6}
              pattern="[0-9]{6}"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="input text-center font-mono text-2xl tracking-[0.5em]"
              placeholder="000000"
              aria-label="6-digit code"
            />
            {error && (
              <p className="border border-[var(--signal)] bg-[rgba(255,77,46,0.08)] px-3 py-2 text-xs text-[var(--signal)]">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="btn btn-signal w-full justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & join"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError("");
              }}
              className="w-full text-xs text-[var(--ink-faint)] transition-colors hover:text-[var(--ink)]"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
