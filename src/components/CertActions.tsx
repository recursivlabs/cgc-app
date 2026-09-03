"use client";

import { useEffect, useState } from "react";
import { Check, Download, Link2, Share2 } from "lucide-react";

/**
 * The two ways out of a certificate: save it as a picture, or send the link.
 * The link unfurls with the certificate and lands the reader one step from
 * joining or signing themselves.
 */
export default function CertActions({
  imageHref,
  sharePath,
  shareTitle,
  shareText,
  downloadName,
}: {
  imageHref: string;
  sharePath: string;
  shareTitle: string;
  shareText: string;
  downloadName: string;
}) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  async function handleShare() {
    const url = `${window.location.origin}${sharePath}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url });
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
    <div className="grid gap-3 sm:grid-cols-2">
      <a href={imageHref} download={downloadName} className="btn btn-ghost justify-center">
        <Download className="h-4 w-4" /> Save image
      </a>
      <button type="button" onClick={handleShare} className="btn btn-signal justify-center">
        {copied ? (
          <>
            <Check className="h-4 w-4" /> Link copied
          </>
        ) : canShare ? (
          <>
            <Share2 className="h-4 w-4" /> Share your link
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4" /> Copy your link
          </>
        )}
      </button>
    </div>
  );
}
