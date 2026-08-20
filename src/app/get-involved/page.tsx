import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Get Involved",
  description:
    "Host a Common Ground Campus event, nominate your school, become a #BridgeBuilder, or partner with us.",
};

const HOST_MAILTO =
  "mailto:felisa@commongroundcampus.com?subject=" +
  encodeURIComponent("Host an event at my campus") +
  "&body=" +
  encodeURIComponent(
    "Hi Felisa,\n\nI'd like to bring a Common Ground Campus event to my campus or community.\n\nSchool / organization:\nCity, state:\nTopic idea (optional):\nBest way to reach me:\n"
  );

const NOMINATE_MAILTO =
  "mailto:felisa@commongroundcampus.com?subject=" +
  encodeURIComponent("School nomination") +
  "&body=" +
  encodeURIComponent(
    "Hi Felisa,\n\nI'd like to nominate a school for a Common Ground Campus event.\n\nSchool:\nCity, state:\nWhy this campus:\n"
  );

interface Way {
  id: string;
  title: string;
  text: string;
  cta: { label: string; href: string };
  external?: boolean;
  featured?: boolean;
}

const WAYS: Way[] = [
  {
    id: "host",
    title: "Host an event",
    text: "The main way this works: you invite us in. We plan it, coordinate it, and pay for it. Your group brings the people. Any campus, any community, any divisive topic.",
    cta: { label: "Start the conversation", href: HOST_MAILTO },
    external: true,
    featured: true,
  },
  {
    id: "join",
    title: "Become a #BridgeBuilder",
    text: "Join the movement. You'll hear about events near you, get invited to Common Bridge summits, and connect with young leaders across the country.",
    cta: { label: "Join free", href: "/auth/register" },
  },
  {
    id: "nominate",
    title: "Nominate your school",
    text: "Know a campus that needs this? Tell us. Universities reach out through this every year.",
    cta: { label: "Nominate a school", href: NOMINATE_MAILTO },
    external: true,
  },
  {
    id: "mentor",
    title: "Mentor or partner",
    text: "Bridge Works runs on people who reach back: mentors, sponsors, and partner organizations who open doors for young leaders.",
    cta: { label: "Reach out", href: "mailto:felisa@commongroundcampus.com?subject=Mentoring%20%2F%20partnership" },
    external: true,
  },
];

export default function GetInvolved() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-36">
        <p className="eyebrow mb-5">Get Involved</p>
        <h1 className="display max-w-3xl text-[clamp(2.6rem,7vw,5.5rem)]">
          Somebody has to go <span className="text-[var(--signal)]">first</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--ink-dim)]">
          For anything good to happen, somebody has to go first. On your campus,
          that&apos;s you.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-28">
        <div className="grid gap-6 md:grid-cols-2">
          {WAYS.map((w) => (
            <div
              key={w.id}
              id={w.id}
              className={`card p-9 ${w.featured ? "md:col-span-2 border-[var(--signal)]" : ""}`}
            >
              <h2 className={`display ${w.featured ? "text-4xl" : "text-3xl"}`}>{w.title}</h2>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--ink-dim)]">{w.text}</p>
              {w.external ? (
                <a href={w.cta.href} className={`btn mt-6 ${w.featured ? "btn-signal" : "btn-ghost"}`}>
                  {w.cta.label} →
                </a>
              ) : (
                <Link href={w.cta.href} className={`btn mt-6 ${w.featured ? "btn-signal" : "btn-ghost"}`}>
                  {w.cta.label} →
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
