"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export default function ShareButton({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        /* user dismissed - fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button type="button" onClick={handleShare} className="btn btn-ghost w-full justify-center">
      {copied ? (
        <>
          <Check className="h-4 w-4 text-[var(--signal)]" /> Link copied
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" /> Share this event
        </>
      )}
    </button>
  );
}
