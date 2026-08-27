import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--ground)]">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="flex items-center gap-3">
              <img src="/logo.png" alt="" className="h-9 w-9" />
              <span className="display text-2xl">
                Common<span className="text-[var(--signal)]">Ground</span>Campus
              </span>
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--ink-dim)]">
              Dialogue over division. We help campuses and communities host
              events where people talk with each other, not past each other.
            </p>
          </div>

          <div>
            <p className="eyebrow mb-4">Explore</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link className="text-[var(--ink-dim)] hover:text-[var(--ink)]" href="/about">About</Link></li>
              <li><Link className="text-[var(--ink-dim)] hover:text-[var(--ink)]" href="/programs">Programs</Link></li>
              <li><Link className="text-[var(--ink-dim)] hover:text-[var(--ink)]" href="/events">Events</Link></li>
              <li><Link className="text-[var(--ink-dim)] hover:text-[var(--ink)]" href="/get-involved">Get Involved</Link></li>
              <li><Link className="text-[var(--ink-dim)] hover:text-[var(--ink)]" href="/resources">Resources</Link></li>
              <li><Link className="text-[var(--ink-dim)] hover:text-[var(--ink)]" href="/declaration">Philadelphia Declaration</Link></li>
            </ul>
          </div>

          <div>
            <p className="eyebrow mb-4">Follow</p>
            <ul className="space-y-2.5 text-sm">
              <li><a className="text-[var(--ink-dim)] hover:text-[var(--ink)]" href="https://www.tiktok.com/@commongroundcampus" target="_blank" rel="noopener noreferrer">TikTok</a></li>
              <li><a className="text-[var(--ink-dim)] hover:text-[var(--ink)]" href="https://www.instagram.com/commongroundcampus/" target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a className="text-[var(--ink-dim)] hover:text-[var(--ink)]" href="https://www.facebook.com/@commongroundcampus" target="_blank" rel="noopener noreferrer">Facebook</a></li>
              <li><a className="text-[var(--ink-dim)] hover:text-[var(--ink)]" href="https://www.twitter.com/@CommonGround_C_" target="_blank" rel="noopener noreferrer">X</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--line)] pt-6 text-xs text-[var(--ink-faint)] md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Common Ground Campus</p>
          <p>
            Built with{" "}
            <a href="https://minds.com" target="_blank" rel="noopener noreferrer" className="text-[var(--ink-dim)] hover:text-[var(--ink)]">
              Minds
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
