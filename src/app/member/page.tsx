import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { query } from "@/lib/db";
import { EVENTS, KIND_LABELS } from "@/lib/events";
import LogoutButton from "./LogoutButton";
import ClaimForm from "./ClaimForm";

export const metadata = { title: "Member" };
export const dynamic = "force-dynamic";

export default async function MemberPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  let existing = null;
  try {
    const res = await query(
      `SELECT name, member_number, created_at FROM members WHERE email = $1`,
      [user.email]
    );
    if (res.rows[0]) {
      existing = {
        name: res.rows[0].name as string,
        number: Number(res.rows[0].member_number),
        date: new Date(res.rows[0].created_at).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
      };
    }
  } catch (error) {
    console.error("Member lookup error:", error);
  }

  const upcoming = EVENTS.filter((e) => e.upcoming);

  return (
    <section className="mx-auto max-w-4xl px-5 pb-28 pt-36">
      <p className="eyebrow mb-5">Member</p>
      <h1 className="display text-[clamp(2.2rem,5vw,4rem)]">
        Welcome, <span className="text-[var(--signal)]">{existing?.name || user.name || "friend"}</span>
      </h1>
      <p className="mt-4 max-w-lg text-lg leading-relaxed text-[var(--ink-dim)]">
        You&apos;ll hear from us at{" "}
        <span className="font-semibold text-[var(--ink)]">{user.email}</span>.
      </p>

      <div className="mt-12">
        <ClaimForm existing={existing} />
      </div>

      {existing && (
        <div className="mt-14 border border-[var(--line)] bg-[var(--panel)] p-7">
          <p className="eyebrow mb-3">Yours to read</p>
          <p className="display text-xl">The Bridge Within</p>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--ink-dim)]">
            The Common Ground Campus booklet. Members get the digital copy free. It is in
            editing now, and we will email it to you the day it is ready.
          </p>
        </div>
      )}

      <div className="mt-14">
        <p className="eyebrow mb-5">What&apos;s next</p>
        {upcoming.map((e) => (
          <div key={e.slug} className="mb-5 border-l-2 border-[var(--signal)] pl-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-dim)]">
              {e.dateLabel ||
                (e.date
                  ? new Date(e.date + "T00:00:00").toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                    })
                  : "Dates coming")}{" "}
              · {KIND_LABELS[e.kind]}
            </p>
            <p className="display mt-1 text-2xl">{e.title}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link href="/events" className="btn btn-signal">Browse events →</Link>
        <Link href="/declaration" className="btn btn-ghost">Sign the Declaration</Link>
        <LogoutButton />
      </div>
    </section>
  );
}
