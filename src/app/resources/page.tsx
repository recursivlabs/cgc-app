import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "The Bridge Within booklet, event videos, Cam on Campus, and the Courageously American vodcast.",
};

const RESOURCES = [
  {
    title: "The Bridge Within",
    tag: "The booklet",
    text: "The book behind the movement, by Felisa Blazek and Brent Hamachek. Why America feels fractured, and the daily practices that rebuild bridges. Publishing soon.",
    cta: { label: "Coming soon", href: null },
  },
  {
    title: "Cam on Campus",
    tag: "Video training",
    text: "Students learn to interview strangers on their own campus, get past “yeah” and “yup”, and edit what they capture. Watch the results on our TikTok.",
    cta: { label: "Watch on TikTok", href: "https://www.tiktok.com/@commongroundcampus" },
  },
  {
    title: "Courageously American",
    tag: "Vodcast",
    text: "Conversations with young leaders who stepped into the arena. Episode one is live.",
    cta: { label: "Watch Episode 1", href: "https://www.youtube.com/watch?v=nQnY6YhF6kY" },
  },
  {
    title: "Event video archive",
    tag: "Highlights",
    text: "One-minute highlights and full recordings from dialogues at Georgia, Houston, West Virginia, Medinah, and more.",
    cta: { label: "Browse events", href: "/events" },
  },
  {
    title: "The Philadelphia Declaration",
    tag: "Founding document",
    text: "A modern consensus document drafted by 40+ scholars and leaders, including our founders, reasserting the principles we share.",
    cta: { label: "Sign On 250", href: "https://sign-on250.org" },
  },
];

export default function Resources() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-36">
        <p className="eyebrow mb-5">Resources</p>
        <h1 className="display max-w-3xl text-[clamp(2.6rem,7vw,5.5rem)]">
          Tools for <span className="text-[var(--signal)]">bridge&nbsp;builders</span>
        </h1>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-28">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {RESOURCES.map((r) => (
            <div key={r.title} className="card flex flex-col p-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--amber)]">{r.tag}</p>
              <h2 className="display mt-2 text-2xl">{r.title}</h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--ink-dim)]">{r.text}</p>
              {r.cta.href ? (
                <a
                  href={r.cta.href}
                  target={r.cta.href.startsWith("http") ? "_blank" : undefined}
                  rel={r.cta.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="mt-5 inline-block font-semibold text-[var(--signal)]"
                >
                  {r.cta.label} →
                </a>
              ) : (
                <p className="mt-5 font-semibold text-[var(--ink-faint)]">{r.cta.label}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
