import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Certificate from "@/components/Certificate";
import { query } from "@/lib/db";
import { DeclarationQuote, DeclarationValues, SignSection } from "../../sections";

export const dynamic = "force-dynamic";

/**
 * A shared signature. The link someone texts a friend: it unfurls with the
 * certificate as its picture, and it lands the friend on the declaration
 * itself, one form away from signing too.
 */

interface Sig {
  name: string;
  number: number;
  date: string;
}

async function getSignature(slug: string): Promise<Sig | null> {
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(slug)) return null;
  try {
    const res = await query(
      `SELECT name, signature_number, created_at
       FROM declaration_signatures WHERE share_slug = $1`,
      [slug]
    );
    const row = res.rows[0];
    if (!row) return null;
    return {
      name: row.name,
      number: Number(row.signature_number),
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
  const sig = await getSignature(slug);
  if (!sig) return { title: "The Philadelphia Declaration" };

  const title = `${sig.name} signed the Philadelphia Declaration`;
  const description = `Signatory No. ${sig.number}. Read the declaration and add your name.`;
  const image = `/api/og/sig/${slug}`;

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

export default async function SharedSignaturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sig = await getSignature(slug);
  if (!sig) redirect("/declaration");

  return (
    <>
      {/* ── The shared certificate ───────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-36">
        <p className="eyebrow mb-5">The Philadelphia Declaration</p>
        <h1 className="display max-w-4xl text-[clamp(2.2rem,5.5vw,4.2rem)]">
          {sig.name} is signatory <span className="grad">No. {sig.number}</span>
        </h1>
        <div className="mt-10 max-w-2xl">
          <Certificate
            name={sig.name}
            number={sig.number}
            label="Has signed"
            title="The Philadelphia Declaration"
            line="Signed in the belief that a free society rests on citizens with agency, character, and equal dignity."
            date={sig.date}
          />
        </div>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[var(--ink-dim)]">
          Read what they signed below. If you stand behind it too, add your name.
        </p>
      </section>

      <DeclarationQuote />
      <DeclarationValues />
      <SignSection />
    </>
  );
}
