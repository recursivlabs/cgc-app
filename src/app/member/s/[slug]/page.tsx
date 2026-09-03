import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Certificate from "@/components/Certificate";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * A shared membership. The link a #BridgeBuilder texts a friend: it unfurls
 * with their certificate, and it lands the friend one step from joining.
 */

interface Member {
  name: string;
  number: number;
  date: string;
}

async function getMember(slug: string): Promise<Member | null> {
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(slug)) return null;
  try {
    const res = await query(
      `SELECT name, member_number, created_at FROM members WHERE share_slug = $1`,
      [slug]
    );
    const row = res.rows[0];
    if (!row) return null;
    return {
      name: row.name,
      number: Number(row.member_number),
      date: new Date(row.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const member = await getMember(slug);
  if (!member) return { title: "Become a #BridgeBuilder" };

  const title = `${member.name} is a #BridgeBuilder`;
  const description = `#BridgeBuilder No. ${member.number} at Common Ground Campus. Join free and get your own number.`;
  const image = `/api/og/member/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function SharedMemberPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = await getMember(slug);
  if (!member) redirect("/get-involved");

  return (
    <>
      {/* ── The shared certificate ───────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-36">
        <p className="eyebrow mb-5">#BridgeBuilders</p>
        <h1 className="display max-w-4xl text-[clamp(2.2rem,5.5vw,4.2rem)]">
          {member.name} is #BridgeBuilder <span className="grad">No. {member.number}</span>
        </h1>
        <div className="mt-10 max-w-2xl">
          <Certificate
            name={member.name}
            number={member.number}
            label="#BridgeBuilder"
            title="Common Ground Campus"
            line="Somebody has to go first for anything good to happen. On this campus, that is you."
            date={member.date}
          />
        </div>
      </section>

      {/* ── The pitch ────────────────────────────────────── */}
      <section className="border-t border-[var(--line)]">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 py-20 md:grid-cols-2 md:gap-20">
          <div>
            <h2 className="display text-[clamp(2rem,4.5vw,3.2rem)] leading-[0.98]">
              Get your own <span className="grad">number</span>
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-[var(--ink-dim)]">
              Bridge Builders are the people who go first: they bring dialogue events to
              their campuses and communities. Joining is free. You get your member number
              and a certificate with your name on it, the digital booklet free, and word
              of events near you.
            </p>
          </div>
          <div className="card flex flex-col justify-center gap-4 p-8">
            <Link href="/auth/register" className="btn btn-signal justify-center">
              Join free →
            </Link>
            <Link href="/get-involved#host" className="btn btn-ghost justify-center">
              Host an event
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
