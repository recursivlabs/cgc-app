import type { Metadata } from "next";
import Link from "next/link";
import { archivedEvents, upcomingEvents, KIND_LABELS, type CgcEvent } from "@/lib/events";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Upcoming Common Ground Campus events and the archive — dialogues, service projects, pop-up cinemas, and the US250 Tailgate Tour.",
};

function fmtDate(e: CgcEvent): { top: string; bottom: string } {
  if (e.dateLabel) {
    const [month, ...rest] = e.dateLabel.split(" ");
    return { top: month, bottom: rest.join(" ") };
  }
  if (e.date) {
    const d = new Date(e.date + "T00:00:00");
    return {
      top: d.toLocaleDateString("en-US", { month: "short" }),
      bottom: String(d.getDate()),
    };
  }
  return e.upcoming ? { top: "TBA", bottom: "" } : { top: "\u2014", bottom: "" };
}

function Row({ e }: { e: CgcEvent }) {
  const d = fmtDate(e);
  return (
    <Link
      href={`/events/${e.slug}`}
      className="group grid grid-cols-[72px_1fr_auto] items-center gap-5 border-t border-[var(--line)] py-6 transition-colors hover:bg-[var(--panel)] md:grid-cols-[88px_1fr_220px_auto] md:gap-8"
    >
      <span className="text-center">
        <span className="display block text-2xl leading-none text-[var(--signal)]">{d.top}</span>
        <span className="display block text-xl leading-tight text-[var(--ink)]">{d.bottom}</span>
      </span>
      <span>
        <span className="display block text-xl leading-tight group-hover:text-[var(--signal)] transition-colors md:text-2xl">
          {e.title}
        </span>
        {(e.campus !== e.title || e.time) && (
          <span className="mt-1 block text-sm text-[var(--ink-dim)]">
            {e.campus !== e.title ? e.campus : ""}
            {e.campus !== e.title && e.time ? " · " : ""}
            {e.time || ""}
          </span>
        )}
      </span>
      <span className="hidden text-xs font-semibold uppercase tracking-widest text-[var(--amber)] md:block">
        {KIND_LABELS[e.kind]}
      </span>
      <span className="text-[var(--ink-faint)] transition-colors group-hover:text-[var(--signal)]" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

export default function EventsPage() {
  const upcoming = upcomingEvents();
  const archive = archivedEvents();
  const dated = archive.filter((e) => e.date);
  const undated = archive.filter((e) => !e.date);

  return (
    <>
      <section className="mx-auto max-w-5xl px-5 pb-12 pt-36">
        <p className="eyebrow mb-5">Events</p>
        <h1 className="display max-w-3xl text-[clamp(2.6rem,7vw,5.5rem)]">
          What&apos;s <span className="text-[var(--signal)]">next</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--ink-dim)]">
          Every event starts with an invitation.{" "}
          <Link href="/get-involved#host" className="font-semibold text-[var(--signal)]">
            Bring us to your campus →
          </Link>
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-20">
        <div className="border-b border-[var(--line)]">
          {upcoming.map((e) => (
            <Row key={e.slug} e={e} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-28">
        <p className="eyebrow mb-2">Archive</p>
        <p className="mb-6 max-w-xl text-sm leading-relaxed text-[var(--ink-dim)]">
          Where we&apos;ve been — with the footage to prove it.
        </p>
        <div className="border-b border-[var(--line)]">
          {dated.map((e) => (
            <Row key={e.slug} e={e} />
          ))}
          {undated.map((e) => (
            <Row key={e.slug} e={e} />
          ))}
        </div>
      </section>
    </>
  );
}
