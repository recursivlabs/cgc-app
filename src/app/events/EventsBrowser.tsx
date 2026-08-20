"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EVENTS, KIND_LABELS, eventStates, type EventKind } from "@/lib/events";
import EventMedia from "@/components/EventMedia";

const KINDS = Object.keys(KIND_LABELS) as EventKind[];

export default function EventsBrowser() {
  const [state, setState] = useState<string>("all");
  const [kind, setKind] = useState<string>("all");
  const [when, setWhen] = useState<"all" | "upcoming" | "past">("all");

  const shown = useMemo(
    () =>
      EVENTS.filter(
        (e) =>
          (state === "all" || e.state === state) &&
          (kind === "all" || e.kind === kind) &&
          (when === "all" || (when === "upcoming" ? !!e.upcoming : !e.upcoming))
      ),
    [state, kind, when]
  );

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pb-10 pt-36">
        <p className="eyebrow mb-5">Events</p>
        <h1 className="display max-w-3xl text-[clamp(2.6rem,7vw,5.5rem)]">
          Where we&apos;ve <span className="text-[var(--signal)]">been</span> — and
          where we&apos;re going
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--ink-dim)]">
          Every event starts with an invitation.{" "}
          <Link href="/get-involved#host" className="font-semibold text-[var(--signal)]">
            Bring us to your campus →
          </Link>
        </p>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-40 border-y border-[var(--line)] bg-[rgba(10,10,12,0.92)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 overflow-x-auto px-5 py-3">
          <FilterGroup
            value={when}
            onChange={(v) => setWhen(v as typeof when)}
            options={[
              ["all", "All"],
              ["upcoming", "Upcoming"],
              ["past", "Past"],
            ]}
          />
          <span className="mx-2 h-5 w-px bg-[var(--line-strong)]" aria-hidden="true" />
          <FilterGroup
            value={kind}
            onChange={setKind}
            options={[["all", "All programs"], ...KINDS.map((k) => [k, KIND_LABELS[k]] as [string, string])]}
          />
          <span className="mx-2 h-5 w-px bg-[var(--line-strong)]" aria-hidden="true" />
          <FilterGroup
            value={state}
            onChange={setState}
            options={[["all", "All states"], ...eventStates().map((s) => [s, s] as [string, string])]}
          />
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        {shown.length === 0 ? (
          <p className="py-20 text-center text-[var(--ink-dim)]">
            Nothing here yet — try different filters.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((e) => (
              <article key={e.slug} id={e.slug} className="card flex flex-col overflow-hidden">
                <EventMedia event={e} />
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--amber)]">
                    {e.state} · {KIND_LABELS[e.kind]}
                    {e.upcoming && (
                      <span className="ml-2 rounded-full bg-[var(--signal)] px-2 py-0.5 text-[10px] font-bold text-white">
                        {e.dateLabel || (e.date ? new Date(e.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Coming")}
                      </span>
                    )}
                  </p>
                  <h2 className="display mt-2 text-2xl">{e.title}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--ink-dim)]">{e.blurb}</p>
                  {e.vimeoIds && e.vimeoIds.length > 1 && (
                    <p className="mt-3 text-xs font-semibold text-[var(--ink-faint)]">
                      {e.vimeoIds.length} video highlights
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function FilterGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            value === v
              ? "bg-[var(--ink)] text-[var(--ground)]"
              : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
          }`}
          aria-pressed={value === v}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
