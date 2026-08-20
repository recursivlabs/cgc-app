import type { Metadata } from "next";
import Link from "next/link";
import { archivedEvents, upcomingEvents, KIND_LABELS, type CgcEvent } from "@/lib/events";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Upcoming Common Ground Campus events and the archive: dialogues, service projects, pop-up cinemas, and the US250 Tailgate Tour.",
};

function fmtDate(e: CgcEvent): { top: string; bottom: string } {
  // An explicit label always wins; otherwise past rows show Month + Year
  // (the year is what matters in an archive) and upcoming rows Month + Day.
  if (e.dateLabel) {
    const [month, ...rest] = e.dateLabel.split(" ");
    return { top: month, bottom: rest.join(" ") };
  }
  if (e.date) {
    const d = new Date(e.date + "T00:00:00");
    if (e.upcoming) {
      return {
        top: d.toLocaleDateString("en-US", { month: "short" }),
        bottom: String(d.getDate()),
      };
    }
    return {
      top: d.toLocaleDateString("en-US", { month: "short" }),
      bottom: String(d.getFullYear()),
    };
  }
  return e.upcoming ? { top: "TBA", bottom: "" } : { top: "", bottom: "" };
}

function Thumb({ e }: { e: CgcEvent }) {
  if (e.image) {
    return (
      <span className="relative block aspect-video w-full overflow-hidden bg-[var(--panel-2)]">
        <img src={e.image} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        {e.vimeoIds?.length ? (
          <span className="absolute bottom-1.5 right-1.5 rounded-sm bg-[rgba(10,10,12,0.75)] px-1.5 py-0.5 text-[10px] font-bold text-white">
            ▶ {e.vimeoIds.length}
          </span>
        ) : null}
      </span>
    );
  }
  return (
    <span className="flex aspect-video w-full flex-col items-center justify-center gap-1 bg-[var(--panel-2)] px-2 text-center">
      <span className="display text-[13px] leading-tight text-[var(--ink-dim)]">{e.title}</span>
      <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-faint)]">US250 Tour</span>
    </span>
  );
}

function Row({ e, thumb }: { e: CgcEvent; thumb?: boolean }) {
  const d = fmtDate(e);
  return (
    <Link
      href={`/events/${e.slug}`}
      className={`group grid items-center gap-5 border-t border-[var(--line)] py-5 transition-colors hover:bg-[var(--panel)] md:gap-8 ${
        thumb
          ? "grid-cols-[72px_96px_1fr_auto] md:grid-cols-[88px_150px_1fr_220px_auto]"
          : "grid-cols-[72px_1fr_auto] md:grid-cols-[88px_1fr_220px_auto]"
      }`}
    >
      <span className="text-center">
        <span className="display block text-2xl leading-none text-[var(--signal)]">{d.top}</span>
        <span className="display block text-xl leading-tight text-[var(--ink)]">{d.bottom}</span>
      </span>
      {thumb && <Thumb e={e} />}
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
      <section className="mx-auto max-w-6xl px-5 pb-12 pt-36">
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

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="border-b border-[var(--line)]">
          {upcoming.map((e) => (
            <Row key={e.slug} e={e} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-28">
        <p className="eyebrow mb-6">Archive</p>
        <div className="border-b border-[var(--line)]">
          {dated.map((e) => (
            <Row key={e.slug} e={e} thumb />
          ))}
          {undated.map((e) => (
            <Row key={e.slug} e={e} thumb />
          ))}
        </div>
      </section>
    </>
  );
}
