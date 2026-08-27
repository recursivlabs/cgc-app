import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { query } from "@/lib/db";
import { INQUIRIES } from "@/lib/inquiries";

export const metadata = { title: "Inbox" };
export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  host: "Wants to host",
  nominate: "Nominating a school",
  partner: "Mentor or partner",
  event: "Question about an event",
};

interface Row {
  id: number;
  kind: string;
  name: string;
  email: string;
  organization: string | null;
  location: string | null;
  detail: string | null;
  message: string | null;
  created_at: string;
}

function when(d: string) {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminPage(props: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?returnTo=/admin");
  if (!isAdmin(user.email)) redirect("/");

  const params = await props.searchParams;
  const filter = params.kind && INQUIRIES[params.kind] ? params.kind : null;

  let rows: Row[] = [];
  let counts: { kind: string; n: number }[] = [];
  let members = 0;
  let signatures = 0;

  try {
    const res = filter
      ? await query(`SELECT * FROM inquiries WHERE kind = $1 ORDER BY created_at DESC LIMIT 200`, [filter])
      : await query(`SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 200`);
    rows = res.rows as Row[];

    const c = await query(`SELECT kind, COUNT(*)::int AS n FROM inquiries GROUP BY kind`);
    counts = c.rows as { kind: string; n: number }[];

    const m = await query(`SELECT COUNT(*)::int AS n FROM members`);
    members = m.rows[0]?.n ?? 0;

    const s = await query(`SELECT COALESCE(MAX(signature_number), 1199)::int AS n FROM declaration_signatures`);
    signatures = s.rows[0]?.n ?? 1199;
  } catch (error) {
    console.error("Admin read error:", error);
  }

  const total = counts.reduce((a, b) => a + b.n, 0);

  return (
    <section className="mx-auto max-w-6xl px-5 pb-28 pt-36">
      <p className="eyebrow mb-5">Inbox</p>
      <h1 className="display text-[clamp(2.2rem,5vw,4rem)]">
        Everything people <span className="text-[var(--signal)]">sent you</span>
      </h1>

      <div className="mt-10 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
        {[
          { label: "Messages", value: total },
          { label: "#BridgeBuilders", value: members },
          { label: "Declaration signatures", value: signatures },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--panel)] p-6">
            <p className="tally">{s.value.toLocaleString()}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-dim)]">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        <Link
          href="/admin"
          className={`border px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
            !filter
              ? "border-[var(--signal)] text-[var(--signal)]"
              : "border-[var(--line)] text-[var(--ink-dim)] hover:text-[var(--ink)]"
          }`}
        >
          All
        </Link>
        {Object.keys(KIND_LABEL).map((k) => {
          const n = counts.find((c) => c.kind === k)?.n ?? 0;
          return (
            <Link
              key={k}
              href={`/admin?kind=${k}`}
              className={`border px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
                filter === k
                  ? "border-[var(--signal)] text-[var(--signal)]"
                  : "border-[var(--line)] text-[var(--ink-dim)] hover:text-[var(--ink)]"
              }`}
            >
              {KIND_LABEL[k]} ({n})
            </Link>
          );
        })}
      </div>

      <div className="mt-8">
        {rows.length === 0 ? (
          <p className="border border-[var(--line)] bg-[var(--panel)] p-8 text-[15px] text-[var(--ink-dim)]">
            Nothing here yet. When someone fills in a form on the site, it lands here.
          </p>
        ) : (
          rows.map((r) => (
            <article key={r.id} className="border-t border-[var(--line)] py-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="display text-xl">
                  {r.name}{" "}
                  <a
                    href={`mailto:${r.email}`}
                    className="text-sm font-normal normal-case tracking-normal text-[var(--signal)]"
                    style={{ fontFamily: "var(--sans)" }}
                  >
                    {r.email}
                  </a>
                </p>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-faint)]">
                  {KIND_LABEL[r.kind] || r.kind} · {when(r.created_at)}
                </p>
              </div>

              {(r.organization || r.location || r.detail) && (
                <p className="mt-2 text-sm text-[var(--amber)]">
                  {[r.organization, r.location, r.detail].filter(Boolean).join(" · ")}
                </p>
              )}

              {r.message && (
                <p className="mt-3 max-w-3xl whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--ink-dim)]">
                  {r.message}
                </p>
              )}

              <a
                href={`mailto:${r.email}?subject=${encodeURIComponent("Re: Common Ground Campus")}`}
                className="mt-4 inline-block text-xs font-semibold uppercase tracking-widest text-[var(--signal)]"
              >
                Reply →
              </a>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
