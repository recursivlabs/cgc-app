"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/programs", label: "Programs" },
  { href: "/events", label: "Events" },
  { href: "/get-involved", label: "Get Involved" },
  { href: "/resources", label: "Resources" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ name?: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {});
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-[var(--line)] bg-[rgba(10,10,12,0.82)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="" className="h-8 w-8" />
          <span className="display text-lg tracking-wide">
            Common<span className="text-[var(--signal)]">Ground</span>Campus
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-[var(--ink-dim)] transition-colors hover:text-[var(--ink)]"
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <Link href="/member" className="btn btn-ghost !px-4 !py-2 text-sm">
              {user.name || "Member"}
            </Link>
          ) : (
            <Link href="/auth/register" className="btn btn-signal !px-4 !py-2 text-sm">
              Join
            </Link>
          )}
        </nav>

        <button
          className="md:hidden text-[var(--ink)] p-2"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          aria-expanded={open}
        >
          <span className="block h-0.5 w-6 bg-current mb-1.5" />
          <span className="block h-0.5 w-6 bg-current mb-1.5" />
          <span className="block h-0.5 w-6 bg-current" />
        </button>
      </div>

      {open && (
        <nav className="border-t border-[var(--line)] bg-[var(--ground)] px-5 py-4 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-base font-medium text-[var(--ink)]"
            >
              {l.label}
            </Link>
          ))}
          <Link href="/auth/register" onClick={() => setOpen(false)} className="btn btn-signal mt-3 w-full justify-center">
            Join
          </Link>
        </nav>
      )}
    </header>
  );
}
