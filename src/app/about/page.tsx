import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Common Ground Campus helps groups host events where real conversation gets easy again. Founded by Felisa Blazek and Brent Hamachek.",
};

export default function About() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-36">
        <p className="eyebrow mb-5">About</p>
        <h1 className="display max-w-3xl text-[clamp(2.6rem,7vw,5.5rem)]">
          We go where we&apos;re <span className="text-[var(--signal)]">invited</span>
        </h1>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="grid gap-14 md:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6 text-lg leading-relaxed text-[var(--ink-dim)]">
            <p>
              Common Ground Campus doesn&apos;t host its own rallies. A student group, a
              school, or a community invites us in, and we help them run an event
              their campus actually wants to attend. We plan it, coordinate it, and
              pay for it. They bring their people.
            </p>
            <p>
              Our method is simple to say and rare to see: get people with opposing
              views in the same room, skip the debate, and work toward something
              everyone can live with. Not a compromise of convictions but a discovery
              of what&apos;s shared.
            </p>
            <p className="text-[var(--ink)]">
              Five years, dozens of campuses, one belief: every person has the same
              right to think for themselves. Everything else is preferences.
            </p>
          </div>

          <div className="space-y-6">
            <div className="card p-7">
              <h2 className="display text-2xl">How an event works</h2>
              <ol className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--ink-dim)]">
                <li><span className="font-semibold text-[var(--signal)]">1.</span> A group picks a topic their campus avoids.</li>
                <li><span className="font-semibold text-[var(--signal)]">2.</span> Students with opposing views take the stage.</li>
                <li><span className="font-semibold text-[var(--signal)]">3.</span> No debate. Each names a real concern.</li>
                <li><span className="font-semibold text-[var(--signal)]">4.</span> The room works out what everyone can live with.</li>
              </ol>
            </div>
            <div className="card p-7">
              <h2 className="display text-2xl">Founders</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ink-dim)]">
                <span className="font-semibold text-[var(--ink)]">Felisa Blazek</span> and{" "}
                <span className="font-semibold text-[var(--ink)]">Brent Hamachek</span>{" "}
                co-founded Common Ground Campus and co-authored{" "}
                <em>The Bridge Within</em>, the booklet behind the
                movement.
              </p>
              <Link href="/resources" className="mt-4 inline-block text-sm font-semibold text-[var(--signal)]">
                Read the booklet →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <p className="display text-[clamp(1.6rem,3.5vw,2.8rem)] leading-tight">
            “We know we can&apos;t do everything. But we can do{" "}
            <span className="text-[var(--amber)]">something</span>. This is our
            something.”
          </p>
          <div className="mt-8">
            <Link href="/get-involved" className="btn btn-signal">
              Join us →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
