import type { Metadata } from "next";
import { DeclarationQuote, DeclarationValues, SignSection } from "./sections";

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

      <DeclarationQuote />
      <DeclarationValues />
      <SignSection />
    </>
  );
}
