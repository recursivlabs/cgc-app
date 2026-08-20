"use client";

import { useState } from "react";
import type { CgcEvent } from "@/lib/events";
import { KIND_LABELS } from "@/lib/events";

/**
 * Uniform media slot for an event card.
 * - Photo when we have one; click-to-play swaps in the Vimeo player for video events.
 * - Designed tile (state + date) when no imagery exists yet — deliberate, not a placeholder.
 */
export default function EventMedia({ event }: { event: CgcEvent }) {
  const [playing, setPlaying] = useState(false);
  const hasVideo = !!event.vimeoIds?.length;

  if (playing && hasVideo) {
    return (
      <div className="relative aspect-video bg-[var(--panel-2)]">
        <iframe
          src={`https://player.vimeo.com/video/${event.vimeoIds![0]}?autoplay=1&title=0&byline=0&portrait=0`}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; fullscreen"
          title={event.title}
        />
      </div>
    );
  }

  if (event.image) {
    const img = (
      <img
        src={event.image}
        alt={event.title}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
    );
    if (hasVideo) {
      return (
        <button
          type="button"
          className="card-media relative block aspect-video w-full cursor-pointer overflow-hidden bg-[var(--panel-2)]"
          onClick={() => setPlaying(true)}
          aria-label={`Play video: ${event.title}`}
        >
          {img}
          <span className="play-badge"><i aria-hidden="true" /></span>
        </button>
      );
    }
    return <div className="relative aspect-video overflow-hidden bg-[var(--panel-2)]">{img}</div>;
  }

  // No imagery yet — designed tile
  return (
    <div className="relative aspect-video overflow-hidden">
      <div className="tile">
        <span className="display text-5xl text-[var(--ink-dim)]">
          {event.state === "US" ? "Online" : event.state}
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest text-[var(--amber)]">
          {event.dateLabel || KIND_LABELS[event.kind]}
        </span>
      </div>
    </div>
  );
}
