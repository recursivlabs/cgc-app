import type { Metadata } from "next";
import Link from "next/link";
import InquiryForm from "@/components/InquiryForm";
import { INQUIRIES } from "@/lib/inquiries";

export const metadata: Metadata = {
  title: "Get Involved",
  description:
    "Host a Common Ground Campus event, nominate your school, become a #BridgeBuilder, mentor a student, or sign the Philadelphia Declaration.",
};

const SECTIONS = [
  {
    id: "host",
    kind: "host",
    title: "Host an event",
    lead: "The main way this works: you invite us in. We plan it, coordinate it, and pay for it. Your group brings the people. Any campus, any community, any divisive topic.",
    note: "Tell us who you are and what you have in mind. That is all we need to start.",
  },
  {
    id: "nominate",
    kind: "nominate",
    title: "Nominate your school",
    lead: "Know a campus that needs this? Tell us. Universities reach out through this every year, and some of our best events started with one student naming a school.",
    note: "You do not have to go there. You just have to think it belongs on the list.",
  },
  {
    id: "mentor",
    kind: "partner",
    title: "Mentor or partner",
    lead: "Bridge Works runs on people who reach back: mentors, sponsors, and partner organizations who open doors for young leaders.",
    note: "Tell us how you want to help and we will find the student who needs it.",
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

      {/* ── Two ways in that don't need a form ───────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid gap-6 md:grid-cols-2">
          <div id="join" className="card p-8">
            <h2 className="display text-2xl">Become a #BridgeBuilder</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-dim)]">
              You get your member number and a certificate with your name on it, the digital
              booklet free, and word of events near you.
            </p>
            <Link href="/auth/register" className="btn btn-signal mt-6">Join free →</Link>
          </div>
          <div id="sign" className="card p-8">
            <h2 className="display text-2xl">Sign the Philadelphia Declaration</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-dim)]">
              A modern reading of the principles in the Declaration of Independence. Read it,
              weigh it, and add your name. We ask for nothing but your name and date of birth.
            </p>
            <Link href="/declaration" className="btn btn-ghost mt-6">Read and sign →</Link>
          </div>
        </div>
      </section>

      {/* ── The three that do ────────────────────────────── */}
      {SECTIONS.map((s, i) => (
        <section
          key={s.id}
          id={s.id}
          className={`border-t border-[var(--line)] ${i % 2 ? "bg-[var(--panel)]" : ""}`}
        >
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:gap-14">
            <div>
              <h2 className="display text-[clamp(1.9rem,4vw,3rem)] leading-[0.98]">{s.title}</h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[var(--ink-dim)]">
                {s.lead}
              </p>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[var(--ink-faint)]">
                {s.note}
              </p>
            </div>
            <InquiryForm spec={INQUIRIES[s.kind]} />
          </div>
        </section>
      ))}
    </>
  );
}
