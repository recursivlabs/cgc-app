import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EVENTS, KIND_LABELS, getEvent } from "@/lib/events";
import RsvpButton from "@/components/RsvpButton";

export function generateStaticParams() {
  return EVENTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const e = getEvent(slug);
  if (!e) return {};
  return { title: e.title, description: e.blurb };
}

export default async function EventPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const e = getEvent(slug);
  if (!e) notFound();

  const dateText = e.dateLabel
    ? e.dateLabel
    : e.date
      ? new Date(e.date + "T00:00:00").toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : e.upcoming
        ? "Dates coming soon"
        : null;

  return (
    <>
      <section className="mx-auto max-w-4xl px-5 pb-10 pt-36">
        <Link href="/events" className="text-sm font-semibold text-[var(--ink-dim)] hover:text-[var(--ink)]">
          ← All events
        </Link>
        <p className="eyebrow mb-4 mt-8">{KIND_LABELS[e.kind]}</p>
        <h1 className="display max-w-3xl text-[clamp(2.4rem,6vw,4.6rem)]">{e.title}</h1>

        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[15px] text-[var(--ink-dim)]">
          {dateText && (
            <span>
              <span className="font-semibold text-[var(--ink)]">{dateText}</span>
              {e.time ? ` · ${e.time}` : ""}
            </span>
          )}
          {e.campus !== e.title && <span>{e.campus}</span>}
        </div>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--ink-dim)]">{e.blurb}</p>

        {e.upcoming && (
          <div className="mt-8">
            {e.rsvp ? (
              <RsvpButton eventId={e.slug} />
            ) : (
              <Link href="/get-involved#host" className="btn btn-ghost">
                Want one like this on your campus? →
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Media — archive events carry the footage */}
      {(e.image || e.vimeoIds?.length) && (
        <section className="mx-auto max-w-4xl px-5 pb-24">
          {e.image && !e.vimeoIds?.length && (
            <img src={e.image} alt={e.title} className="w-full border border-[var(--line)]" />
          )}
          {e.vimeoIds && e.vimeoIds.length > 0 && (
            <>
              <p className="eyebrow mb-5">Highlights</p>
              <div className="grid gap-4 md:grid-cols-2">
                {e.vimeoIds.map((id, i) => (
                  <div
                    key={id}
                    className={`relative aspect-video bg-[var(--panel-2)] ${i === 0 ? "md:col-span-2" : ""}`}
                  >
                    <iframe
                      src={`https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`}
                      className="absolute inset-0 h-full w-full"
                      allow="fullscreen"
                      title={`${e.title} — video ${i + 1}`}
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <section className="border-t border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center">
          <p className="display text-3xl">
            Don&apos;t watch from the <span className="text-[var(--signal)]">sidelines</span>
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href="/auth/register" className="btn btn-signal">
              Become a #BridgeBuilder →
            </Link>
            <Link href="/get-involved#host" className="btn btn-ghost">
              Host an event
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
