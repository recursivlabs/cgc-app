import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EVENTS, KIND_LABELS, getEvent, type CgcEvent } from "@/lib/events";
import RsvpButton from "@/components/RsvpButton";
import ShareButton from "@/components/ShareButton";
import EventQuestion from "@/components/EventQuestion";

export function generateStaticParams() {
  return EVENTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const e = getEvent(slug);
  if (!e) return {};
  return {
    title: e.title,
    description: e.blurb,
    openGraph: {
      title: `${e.title} | Common Ground Campus`,
      description: e.blurb,
      type: "article",
      images: [{ url: `/og/events/${e.slug}.jpg`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${e.title} | Common Ground Campus`,
      description: e.blurb,
      images: [`/og/events/${e.slug}.jpg`],
    },
  };
}

function fullDate(e: CgcEvent): string | null {
  if (e.date) {
    const d = new Date(e.date + "T00:00:00").toLocaleDateString("en-US", {
      weekday: e.upcoming ? "long" : undefined,
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    // Past events with a label only know the date approximately - show the label.
    if (e.dateLabel && !e.upcoming) return e.dateLabel;
    return d;
  }
  if (e.dateLabel) return e.dateLabel;
  return e.upcoming ? "Dates announced soon" : null;
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[var(--line)] py-4 first:border-t-0 first:pt-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-faint)]">
        {label}
      </p>
      <p className="mt-1.5 text-[15px] font-medium leading-snug text-[var(--ink)]">{children}</p>
    </div>
  );
}

export default async function EventPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const e = getEvent(slug);
  if (!e) notFound();

  const dateText = fullDate(e);
  const stateName = e.state === "US" ? "Online" : e.state;

  return (
    <>
      {/* ── Header ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-12 pt-32">
        <nav className="mb-10 text-sm font-medium text-[var(--ink-dim)]" aria-label="Breadcrumb">
          <Link href="/events" className="hover:text-[var(--ink)]">
            Events
          </Link>
          <span className="mx-2 text-[var(--ink-faint)]">/</span>
          <span className="text-[var(--ink-faint)]">{e.title}</span>
        </nav>

        <div className="flex flex-wrap items-center gap-3">
          <span className="eyebrow">{KIND_LABELS[e.kind]}</span>
          {e.upcoming ? (
            <>
              <span className="rounded-full bg-[var(--signal)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#141413]">
                Upcoming
              </span>
              {e.inviteOnly && (
                <span className="rounded-full border border-[var(--amber)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[var(--amber)]">
                  Invitation only
                </span>
              )}
            </>
          ) : (
            <span className="rounded-full border border-[var(--line-strong)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-dim)]">
              Past event
            </span>
          )}
        </div>
        <h1 className="display mt-4 max-w-4xl text-[clamp(2.6rem,6.5vw,5rem)]">{e.title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--ink-dim)]">{e.blurb}</p>
      </section>

      {/* ── Body: media + facts rail ───────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          {/* Main column */}
          <div className="min-w-0">
            {e.image && (
              <img
                src={e.image}
                alt={e.title}
                className="w-full border border-[var(--line)]"
              />
            )}

            {e.flyer && (
              <div className={e.image ? "mt-10" : ""}>
                <p className="eyebrow mb-5">Event flyer</p>
                <a href={e.flyer} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={e.flyer}
                    alt={`${e.title} event flyer`}
                    className="max-h-[560px] w-auto border border-[var(--line)]"
                    loading="lazy"
                  />
                </a>
              </div>
            )}

            {e.vimeoIds && e.vimeoIds.length > 0 && (
              <div className="mt-10">
                <p className="eyebrow mb-5">Video highlights</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {e.vimeoIds.map((id, i) => (
                    <div
                      key={id}
                      className={`relative aspect-video bg-[var(--panel-2)] ${i === 0 ? "sm:col-span-2" : ""}`}
                    >
                      <iframe
                        src={`https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`}
                        className="absolute inset-0 h-full w-full"
                        allow="fullscreen"
                        title={`${e.title}, video ${i + 1}`}
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How it works - context for people deciding to attend */}
            {e.upcoming && (
              <div className="mt-10 border border-[var(--line)] bg-[var(--panel)] p-8">
                <p className="eyebrow mb-4">What to expect</p>
                <ul className="space-y-3 text-[15px] leading-relaxed text-[var(--ink-dim)]">
                  {e.inviteOnly ? (
                    <>
                      <li>
                        <span className="font-semibold text-[var(--ink)]">Invitation only.</span>{" "}
                        This gathering is for past and present CGC leaders. Members can invite
                        someone new.
                      </li>
                      <li>
                        <span className="font-semibold text-[var(--ink)]">Youth led.</span> The
                        floor belongs to the student leaders.
                      </li>
                      <li>
                        <span className="font-semibold text-[var(--ink)]">Real conversation.</span>{" "}
                        No debate-style points-scoring. The room works toward what everyone can
                        live with.
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <span className="font-semibold text-[var(--ink)]">Everyone is welcome.</span>{" "}
                        You don&apos;t need the right opinions, just show up as you are.
                      </li>
                      <li>
                        <span className="font-semibold text-[var(--ink)]">Free to attend.</span> We
                        plan, coordinate, and cover the event.
                      </li>
                      <li>
                        <span className="font-semibold text-[var(--ink)]">Real conversation.</span>{" "}
                        No debate-style points-scoring. The room works toward what everyone can
                        live with.
                      </li>
                    </>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Facts rail */}
          <aside className="h-fit lg:sticky lg:top-24">
            <div className="border border-[var(--line)] bg-[var(--panel)] p-6">
              <Fact label="Date">{dateText || "To be announced"}</Fact>
              {e.time && <Fact label="Time">{e.time}</Fact>}
              <Fact label="Location">
                {e.venue ? (
                  <>
                    {e.campus}
                    <span className="mt-1 block text-[13px] font-normal text-[var(--ink-dim)]">
                      {e.venue}
                    </span>
                  </>
                ) : (
                  <>
                    {e.campus}
                    {e.state !== "US" && e.campus !== e.title ? `, ${e.state}` : ""}
                    {e.state === "US" ? " (join from anywhere)" : ""}
                  </>
                )}
              </Fact>
              <Fact label="Program">{KIND_LABELS[e.kind]}</Fact>
              <Fact label="Cost">Free</Fact>

              <div className="mt-6 flex flex-col gap-2.5">
                {e.upcoming && e.rsvp && <RsvpButton eventId={e.slug} />}
                {e.upcoming && e.date && (
                  <a href={`/api/ics?event=${e.slug}`} className="btn btn-ghost w-full justify-center">
                    Add to calendar
                  </a>
                )}
                <ShareButton title={`${e.title} | Common Ground Campus`} text={e.blurb} />
              </div>

              {!e.upcoming && (
                <p className="mt-5 border-t border-[var(--line)] pt-4 text-[13px] leading-relaxed text-[var(--ink-dim)]">
                  This event has ended. Want one like it on your campus?{" "}
                  <Link href="/get-involved#host" className="font-semibold text-[var(--signal)]">
                    Invite us →
                  </Link>
                </p>
              )}
            </div>

            <EventQuestion title={e.title} />
          </aside>
        </div>
      </section>

      {/* ── Next events / closing CTA ──────────────────────── */}
      <section className="border-t border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <p className="display text-3xl">
                Don&apos;t watch from the <span className="text-[var(--signal)]">sidelines</span>
              </p>
              <p className="mt-2 max-w-md text-[15px] text-[var(--ink-dim)]">
                Join the #BridgeBuilders to hear about every event, or bring one to your campus.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/auth/register" className="btn btn-signal">
                Join free →
              </Link>
              <Link href="/get-involved#host" className="btn btn-ghost">
                Host an event
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
