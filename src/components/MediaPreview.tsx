"use client";

import { useState } from "react";
import { Film, Image as ImageIcon } from "lucide-react";

/**
 * Plays a video or shows a photo inline. Some phone formats (HEIC photos,
 * HEVC .mov on Chrome) don't play in every browser; then we say so and the
 * Download button still works.
 */
export default function MediaPreview({ id, contentType }: { id: number; contentType: string }) {
  const [broken, setBroken] = useState(false);
  const isImage = contentType.startsWith("image/");
  const src = `/api/videos/${id}`;

  if (broken) {
    return (
      <div className="flex aspect-[9/16] max-h-[520px] w-full flex-col items-center justify-center gap-2 bg-[var(--panel)] text-center text-xs text-[var(--ink-dim)]">
        {isImage ? <ImageIcon className="h-6 w-6" /> : <Film className="h-6 w-6" />}
        <span>This browser can&apos;t preview it.<br />Download to view.</span>
      </div>
    );
  }

  return isImage ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading="lazy" onError={() => setBroken(true)}
      className="max-h-[520px] w-full bg-black object-contain" />
  ) : (
    <video src={src} controls playsInline preload="none" onError={() => setBroken(true)}
      className="max-h-[520px] w-full bg-black" />
  );
}
