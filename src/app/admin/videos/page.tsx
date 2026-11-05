import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { canSeeVideos, isAdmin } from "@/lib/admin";
import { query } from "@/lib/db";
import { formatBytes } from "@/lib/videos";
import MediaPreview from "@/components/MediaPreview";

export const metadata = { title: "Ambassador uploads" };
export const dynamic = "force-dynamic";

/** Ambassador retainer: 5 to 10 videos a month. */
const MONTHLY_GOAL = 5;

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
  let tally: { email: string; name: string; videos: number; photos: number }[] = [];
  try {
    const res = await query(
      `SELECT id, name, email, filename, content_type, size_bytes, note, created_at
         FROM video_uploads ORDER BY created_at DESC LIMIT 300`
    );
    rows = res.rows as Row[];

    // This month so far, Eastern time: the retainer asks for 5 to 10 videos.
    const t = await query(
      `SELECT email,
              (ARRAY_AGG(name ORDER BY created_at DESC))[1] AS name,
              COUNT(*) FILTER (WHERE content_type LIKE 'video/%')::int AS videos,
              COUNT(*) FILTER (WHERE content_type LIKE 'image/%')::int AS photos
         FROM video_uploads
        WHERE (created_at AT TIME ZONE 'America/New_York')
              >= date_trunc('month', NOW() AT TIME ZONE 'America/New_York')
        GROUP BY email
        ORDER BY videos DESC, name`
    );
    tally = t.rows as typeof tally;
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

      {tally.length > 0 && (
        <div className="mt-10">
          <p className="eyebrow mb-4">
            This month · goal {MONTHLY_GOAL} videos each
          </p>
          <p className="-mt-2 mb-4 text-xs text-[var(--ink-faint)]">
            Counted by the email each person typed in, so check the videos themselves before paying on it.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tally.map((t) => (
              <div key={t.email} title={t.email} className="border border-[var(--line)] bg-[var(--panel)] p-5">
                <p className="truncate text-[15px] font-semibold">{t.name}</p>
                <p className="mt-2">
                  <span className={`tally ${t.videos >= MONTHLY_GOAL ? "text-[var(--signal)]" : ""}`}>
                    {t.videos}
                  </span>
                  <span className="ml-2 text-sm text-[var(--ink-dim)]">
                    / {MONTHLY_GOAL} videos{t.photos ? ` · ${t.photos} photo${t.photos === 1 ? "" : "s"}` : ""}
                  </span>
                </p>
                <div className="mt-3 h-1 bg-[var(--line)]">
                  <div className="h-1 bg-[var(--signal)]"
                    style={{ width: `${Math.min(100, (t.videos / MONTHLY_GOAL) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        {rows.length === 0 ? (
          <p className="border border-[var(--line)] bg-[var(--panel)] p-8 text-[15px] text-[var(--ink-dim)]">
            Nothing yet. Share the upload link with your ambassadors.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <article key={r.id} className="card overflow-hidden">
                <MediaPreview id={r.id} contentType={r.content_type} />
                <div className="p-5">
                  <p className="truncate text-[15px] font-semibold">{r.name}</p>
                  <p className="mt-1 truncate text-xs text-[var(--ink-dim)]">
                    {r.filename} · {formatBytes(Number(r.size_bytes))} · {when(r.created_at)}
                  </p>
                  {r.note && <p className="mt-2 text-sm text-[var(--amber)]">{r.note}</p>}
                  <a
                    href={`/api/videos/${r.id}?dl=1`}
                    className="mt-4 inline-block text-xs font-semibold uppercase tracking-widest text-[var(--signal)]"
                  >
                    Download →
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
