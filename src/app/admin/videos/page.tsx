import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { canSeeVideos, isAdmin } from "@/lib/admin";
import { query } from "@/lib/db";
import { formatBytes } from "@/lib/videos";

export const metadata = { title: "Ambassador uploads" };
export const dynamic = "force-dynamic";

interface Row {
  id: number;
  name: string;
  email: string;
  filename: string;
  content_type: string;
  size_bytes: string;
  note: string | null;
  created_at: string;
}

function when(d: string) {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function VideosPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?returnTo=/admin/videos");
  if (!canSeeVideos(user.email)) redirect("/");

  let rows: Row[] = [];
  try {
    const res = await query(
      `SELECT id, name, email, filename, content_type, size_bytes, note, created_at
         FROM video_uploads ORDER BY created_at DESC LIMIT 300`
    );
    rows = res.rows as Row[];
  } catch (error) {
    console.error("Videos read error:", error);
  }

  return (
    <section className="mx-auto max-w-6xl px-5 pb-28 pt-36">
      <p className="eyebrow mb-5">
        {isAdmin(user.email) ? <Link href="/admin">Inbox</Link> : "Team"} / Videos
      </p>
      <h1 className="display text-[clamp(2.2rem,5vw,4rem)]">
        Ambassador <span className="text-[var(--signal)]">videos</span>
      </h1>
      <p className="mt-4 text-[15px] text-[var(--ink-dim)]">
        Ambassadors send these from <span className="text-[var(--ink)]">commongroundcampus.com/upload</span>. Newest first.
      </p>

      <div className="mt-10">
        {rows.length === 0 ? (
          <p className="border border-[var(--line)] bg-[var(--panel)] p-8 text-[15px] text-[var(--ink-dim)]">
            Nothing yet. Share the upload link with your ambassadors.
          </p>
        ) : (
          rows.map((r) => (
            <article key={r.id} className="flex flex-wrap items-baseline justify-between gap-3 border-t border-[var(--line)] py-5">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold">{r.filename}</p>
                <p className="mt-1 text-sm text-[var(--ink-dim)]">
                  {r.content_type.startsWith("image/") ? "Photo" : "Video"} · {r.name} · {formatBytes(Number(r.size_bytes))} · {when(r.created_at)}
                </p>
                {r.note && <p className="mt-2 max-w-3xl text-sm text-[var(--amber)]">{r.note}</p>}
              </div>
              <a
                href={`/api/videos/${r.id}`}
                target="_blank"
                rel="noopener"
                className="text-xs font-semibold uppercase tracking-widest text-[var(--signal)]"
              >
                Download →
              </a>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
