import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { EVENTS, KIND_LABELS } from "@/lib/events";
import LogoutButton from "./LogoutButton";

export const metadata = { title: "Member" };

export default async function MemberPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const upcoming = EVENTS.filter((e) => e.upcoming);

  return (
    <section className="mx-auto max-w-4xl px-5 pb-28 pt-36">
      <p className="eyebrow mb-5">Member</p>
      <h1 className="display text-[clamp(2.2rem,5vw,4rem)]">
        Welcome, <span className="text-[var(--signal)]">{user.name || "friend"}</span>
      </h1>
      <p className="mt-4 max-w-lg text-lg leading-relaxed text-[var(--ink-dim)]">
        You&apos;re a #BridgeBuilder. You&apos;ll hear about events and announcements
        at <span className="font-semibold text-[var(--ink)]">{user.email}</span>.
      </p>

      <div className="mt-12">
        <p className="eyebrow mb-5">What&apos;s next</p>
        {upcoming.map((e) => (
          <div key={e.slug} className="mb-5 border-l-2 border-[var(--signal)] pl-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-dim)]">
              {e.dateLabel || (e.date ? new Date(e.date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "Dates coming")}{" "}
              · {KIND_LABELS[e.kind]}
            </p>
            <p className="display mt-1 text-2xl">{e.title}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 flex gap-4">
        <Link href="/events" className="btn btn-signal">Browse events →</Link>
        <LogoutButton />
      </div>
    </section>
  );
}
