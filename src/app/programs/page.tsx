import type { Metadata } from "next";
import Link from "next/link";
import { MessagesSquare, HeartHandshake, GraduationCap, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Bridging the Divide, Bridge to Tomorrow, Bridge Works, and Common Bridge — four programs, one goal: better conversations.",
};

const PROGRAMS = [
  {
    id: "bridging-the-divide",
    name: "Bridging the Divide",
    tag: "Structured dialogue",
    Icon: MessagesSquare,
    text: "Students pick a topic that divides their campus. People with opposing views take the stage — not to debate, but to name their real concerns and work out an answer everyone can live with. Audiences keep telling us the same thing: more fun than the fight they expected.",
    cta: { label: "Bring one to your campus", href: "/get-involved#host" },
  },
  {
    id: "bridge-to-tomorrow",
    name: "Bridge to Tomorrow",
    tag: "Shared action",
    Icon: HeartHandshake,
    text: "Conversation turns into service: border cleanups in 100-degree heat, rival campuses cleaning a beach together, pop-up cinemas that end in real talk. You learn what you share by doing something that matters, side by side.",
    cta: { label: "See past events", href: "/events" },
  },
  {
    id: "bridge-works",
    name: "Bridge Works",
    tag: "Mentorship & training",
    Icon: GraduationCap,
    text: "Leadership training for the students who step up. Cam on Campus teaches interviewing and editing on real streets. The Courageously American vodcast gives young voices a platform. Mentors open doors — referrals, publications, career introductions.",
    cta: { label: "Apply for mentorship", href: "/get-involved" },
  },
  {
    id: "common-bridge",
    name: "Common Bridge",
    tag: "Monthly online summit",
    Icon: Globe,
    text: "A monthly forum for past and present CGC leaders across the country — invitation only, and every member can invite someone new. Four out of five participants have recommended a friend.",
    cta: { label: "Get invited", href: "/auth/register" },
  },
];

export default function Programs() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-36">
        <p className="eyebrow mb-5">Programs</p>
        <h1 className="display max-w-3xl text-[clamp(2.6rem,7vw,5.5rem)]">
          Our <span className="text-[var(--signal)]">programs</span>
        </h1>
      </section>

      <section className="mx-auto max-w-6xl space-y-px px-5 pb-28">
        {PROGRAMS.map((p) => (
          <div
            key={p.id}
            id={p.id}
            className="grid gap-6 border-t border-[var(--line)] py-14 md:grid-cols-[80px_1fr_1.4fr] md:gap-10"
          >
            <span className="program-chip">
              <p.Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--amber)]">{p.tag}</p>
              <h2 className="display mt-2 text-[clamp(1.8rem,3.5vw,2.8rem)]">{p.name}</h2>
            </div>
            <div>
              <p className="text-lg leading-relaxed text-[var(--ink-dim)]">{p.text}</p>
              <Link href={p.cta.href} className="mt-5 inline-block font-semibold text-[var(--signal)]">
                {p.cta.label} →
              </Link>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
