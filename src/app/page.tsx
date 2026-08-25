import Link from "next/link";
import { EVENTS, HERO_VIMEO_ID, KIND_LABELS, SCHOOLS } from "@/lib/events";
import HeroBridge from "@/components/HeroBridge";
import { MessagesSquare, HeartHandshake, GraduationCap, Globe } from "lucide-react";

const PROGRAMS = [
  {
    name: "Bridging the Divide",
    text: "Structured dialogues on the topics campuses avoid. No debate. No winners. Common ground.",
    Icon: MessagesSquare,
  },
  {
    name: "Bridge to Tomorrow",
    text: "Service projects and immersive experiences: border cleanups, beach days, pop-up cinemas.",
    Icon: HeartHandshake,
  },
  {
    name: "Bridge Works",
    text: "Mentorship and leadership training. Cam on Campus. Courageously American.",
    Icon: GraduationCap,
  },
  {
    name: "Common Bridge",
    text: "Monthly online summits for young leaders across the country. Invitation only.",
    Icon: Globe,
  },
];

export default function Home() {
  const featured = EVENTS.filter((e) => e.vimeoIds?.length).slice(0, 3);
  const upcoming = EVENTS.filter((e) => e.upcoming);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative flex min-h-[86svh] items-center overflow-hidden">
        <HeroBridge />
        <div className="hero-scrim" aria-hidden="true" />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-5 py-24">
          <p className="eyebrow mb-5">On campuses across the country</p>
          <h1 className="display text-[clamp(3rem,9vw,8rem)]">
            Dialogue
            <br />
            over <span className="grad">division</span>
          </h1>
          <p className="hero-sub mt-6 max-w-xl text-lg leading-relaxed">
            We help campuses and communities host events where people talk{" "}
            <em className="not-italic font-bold">with</em> each other, not past each other.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link href="/get-involved#host" className="btn btn-signal">
              Host an event →
            </Link>
            <Link href="/auth/register" className="btn btn-ghost">
              Become a #BridgeBuilder
            </Link>
          </div>
        </div>
      </section>

      {/* ── Campus pennants marquee ──────────────────────── */}
      <section className="border-y border-[var(--line)] py-5" aria-label="Campuses we have worked with">
        <div className="overflow-hidden">
          <div className="marquee-track">
            {[0, 1].map((i) => (
              <div key={i} className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={i === 1}>
                {SCHOOLS.map((name) => (
                  <span key={`${i}-${name}`} className="pennant">
                    <span className="display text-lg text-[var(--ink-dim)]">{name}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The reel - as seen in the news ───────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="relative aspect-video border border-[var(--line)] bg-[var(--panel-2)]">
            <iframe
              src={`https://player.vimeo.com/video/${HERO_VIMEO_ID}?title=0&byline=0&portrait=0`}
              className="absolute inset-0 h-full w-full"
              allow="fullscreen; picture-in-picture"
              title="Common Ground Campus in the news"
            />
          </div>
          <div>
            <p className="eyebrow mb-4">In the news</p>
            <h2 className="display text-[clamp(2.2rem,5vw,4rem)]">
              See what we&apos;re <span className="grad">building</span>
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--ink-dim)]">
              Four minutes on who we are and why this works: the events, the
              students, and the coverage. Press play.
            </p>
          </div>
        </div>
      </section>

      {/* ── The problem / the answer ─────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-28">
        <div className="grid gap-12 md:grid-cols-2">
          <h2 className="display text-[clamp(2.2rem,5vw,4rem)]">
            Campuses are
            <br />
            walking on <span className="grad">eggshells</span>
          </h2>
          <div className="flex flex-col justify-center gap-5 text-lg leading-relaxed text-[var(--ink-dim)]">
            <p>
              Most students hold back what they think, afraid of being judged. The
              silence looks like agreement. It isn&apos;t.
            </p>
            <p className="text-[var(--ink)]">
              We build the rooms where that changes: low-pressure, student-powered
              events where real conversation gets easy again.
            </p>
          </div>
        </div>
      </section>

      {/* ── Programs ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-28">
        <p className="eyebrow mb-8">Our programs</p>
        <div className="grid gap-px overflow-hidden border border-[var(--line)] bg-[var(--line)] md:grid-cols-2">
          {PROGRAMS.map((p) => (
            <Link
              key={p.name}
              href="/programs"
              className="group bg-[var(--ground)] p-9 transition-colors hover:bg-[var(--panel)]"
            >
              <span className="program-chip mb-5">
                <p.Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="display text-3xl group-hover:text-[var(--signal)] transition-colors">
                {p.name}
              </h3>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--ink-dim)]">
                {p.text}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Real events ──────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-28">
        <div className="mb-8 flex items-end justify-between">
          <p className="eyebrow">Real events. Real rooms.</p>
          <Link href="/events" className="text-sm font-semibold text-[var(--ink-dim)] hover:text-[var(--ink)]">
            All events →
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featured.map((e) => (
            <Link key={e.slug} href={`/events/${e.slug}`} className="card group overflow-hidden">
              <div className="relative aspect-video overflow-hidden bg-[var(--panel-2)]">
                <img
                  src={e.image!}
                  alt={e.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="play-badge"><i aria-hidden="true" /></span>
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--amber)]">
                  {e.state} · {e.topic}
                </p>
                <h3 className="display mt-2 text-2xl">{e.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-dim)]">{e.blurb}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Voices ───────────────────────────────────────── */}
      <section className="border-y border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto max-w-4xl px-5 py-24 text-center">
          <p className="display text-[clamp(1.8rem,4vw,3.2rem)] leading-tight">
            “This was amazing. This needs to happen on{" "}
            <span className="text-[var(--signal)]">every campus</span> in the country.”
          </p>
          <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-[var(--ink-dim)]">
            Event participant
          </p>
        </div>
      </section>

      {/* ── Upcoming + join ──────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-28">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="eyebrow mb-5">What&apos;s next</p>
            {upcoming.map((e) => (
              <Link
                key={e.slug}
                href={`/events/${e.slug}`}
                className="group mb-5 block border-l-2 border-[var(--signal)] pl-5"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-dim)]">
                  {e.dateLabel || (e.date ? new Date(e.date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "Dates coming")}{" "}
                  · {KIND_LABELS[e.kind]}
                </p>
                <p className="display mt-1 text-2xl transition-colors group-hover:text-[var(--signal)]">
                  {e.title} <span className="text-[var(--ink-faint)] transition-colors group-hover:text-[var(--signal)]">→</span>
                </p>
              </Link>
            ))}
          </div>
          <div className="card p-10">
            <h2 className="display text-4xl">
              Join the <span className="text-[var(--amber)]">movement</span>
            </h2>
            <p className="mt-4 leading-relaxed text-[var(--ink-dim)]">
              Become a #BridgeBuilder to hear about upcoming events, get invited
              to Common Bridge summits, and connect with people doing this work
              across the country.
            </p>
            <Link href="/auth/register" className="btn btn-signal mt-7">
              Join the movement →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
