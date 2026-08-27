import type { Metadata } from "next";
import SignForm from "./SignForm";

export const metadata: Metadata = {
  title: "The Philadelphia Declaration",
  description:
    "A modern reading of the principles in the Declaration of Independence. Read it, weigh it, and add your name.",
  openGraph: {
    title: "Sign the Philadelphia Declaration",
    description:
      "A modern reading of the principles in the Declaration of Independence. Read it, weigh it, and add your name.",
  },
};

const VALUES = [
  {
    n: "01",
    head: "Reality is the standard of true and false",
    text: "Reality sets limits on what we can do and achieve. It also offers us room for choice, achievement, and progress.",
    against: "Views that deny facts, or deny that truth is possible at all.",
  },
  {
    n: "02",
    head: "We are both individuals and social beings",
    text: "Only individuals think, and only individuals choose. We also live in families, friendships, work, and civic life, and those bonds give life meaning.",
    against: "The view that we are all determined, or that a person is defined by race, sex, or any other group.",
  },
  {
    n: "03",
    head: "A free society depends on character",
    text: "It asks its citizens for agency, honesty, responsibility, gratitude, courage, and goodwill toward others. Those traits are what make the pursuit of happiness possible.",
    against: "The mindset of entitlement that claims what it did not earn and refuses responsibility for its own actions.",
  },
  {
    n: "04",
    head: "A free society is the most productive and inclusive kind",
    text: "It lets people explore, collaborate, and create in every part of life. The success of one person does not come at the expense of another.",
    against: "The view that progress is a zero-sum game, and that one person's success is another's loss.",
  },
];

export default function DeclarationPage() {
  return (
    <>
      {/* ── Opening ──────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-14 pt-36">
        <p className="eyebrow mb-5">The Philadelphia Declaration</p>
        <h1 className="display max-w-4xl text-[clamp(2.6rem,7vw,5.5rem)]">
          What did the founders miss, and what can we do{" "}
          <span className="grad">better</span>?
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-relaxed text-[var(--ink-dim)]">
          In April of 2024 a group met in Philadelphia to ask that question. Common Ground
          Campus was part of it. What came out is a modern reading of the principles in the
          Declaration of Independence, written for the next 250 years.
        </p>
      </section>

      {/* ── The ask ──────────────────────────────────────── */}
      <section className="border-y border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <p className="display max-w-3xl text-[clamp(1.5rem,3.4vw,2.4rem)] leading-[1.15]">
            &ldquo;We believe that adopting these values will be the source of progress for our
            country and others throughout the world. A vibrant, exciting, and life-affirming
            future.&rdquo;
          </p>
        </div>
      </section>

      {/* ── Values ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="eyebrow mb-9">What it stands for</p>
        <div className="grid gap-px bg-[var(--line)] md:grid-cols-2">
          {VALUES.map((v) => (
            <div key={v.n} className="bg-[var(--ground)] p-8">
              <span className="display text-[var(--signal)]">{v.n}</span>
              <h2 className="display mt-3 text-2xl leading-tight">{v.head}</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-[var(--ink-dim)]">{v.text}</p>
              <p className="mt-4 border-l-2 border-[var(--line-strong)] pl-4 text-[14px] italic leading-relaxed text-[var(--ink-faint)]">
                As against: {v.against}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-2xl text-[15px] leading-relaxed text-[var(--ink-dim)]">
          The full document runs longer than this. It does not ask you to agree with every
          line. It asks you to read it carefully and think for yourself.
        </p>
      </section>

      {/* ── Sign ─────────────────────────────────────────── */}
      <section className="border-t border-[var(--line)]">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 py-20 md:grid-cols-2 md:gap-20">
          <div>
            <h2 className="display text-[clamp(2rem,4.5vw,3.2rem)] leading-[0.98]">
              Add your <span className="grad">name</span>
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-[var(--ink-dim)]">
              Signing says you have read it and you stand behind it. It is not a membership
              and it does not sign you up for anything.
            </p>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[var(--ink-faint)]">
              Becoming a #BridgeBuilder is separate. You can do one, the other, or both.
            </p>
          </div>
          <div className="card p-8">
            <SignForm />
          </div>
        </div>
      </section>
    </>
  );
}
