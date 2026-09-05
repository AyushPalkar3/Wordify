"use client";

import Link from "next/link";
import { useState } from "react";
import { logoutAction } from "@/lib/auth/actions";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/library", label: "My Library" },
  { href: "/practice", label: "Practice" },
  { href: "/history", label: "History" },
];

export function Navbar({ user }: { user?: { name?: string | null } | null }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-rule bg-paper-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link href="/dashboard" className="flex items-baseline gap-2">
          <span className="font-display text-xl italic text-ink">Lexicon</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">
            catalog
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-sm px-3 py-1.5 font-sans text-sm text-ink-soft transition-colors hover:bg-rule-soft hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="font-mono text-xs text-ink-soft">{user.name}</span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-sm border border-rule px-3 py-1.5 font-sans text-sm text-ink-soft hover:bg-rule-soft hover:text-ink"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-sm px-3 py-1.5 font-sans text-sm text-ink-soft hover:text-ink"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-sm bg-ink px-3 py-1.5 font-sans text-sm font-medium text-paper-card hover:bg-[#343b4d]"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="flex h-9 w-9 items-center justify-center rounded-sm border border-rule text-ink md:hidden"
        >
          <span aria-hidden className="font-mono text-lg leading-none">
            {menuOpen ? "×" : "☰"}
          </span>
        </button>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <nav
          id="mobile-nav-menu"
          className="flex flex-col gap-1 border-t border-rule px-6 py-3 md:hidden"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-sm px-3 py-2 font-sans text-sm text-ink-soft hover:bg-rule-soft hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex items-center gap-3 border-t border-rule-soft pt-3">
            {user ? (
              <>
                <span className="font-mono text-xs text-ink-soft">{user.name}</span>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="rounded-sm border border-rule px-3 py-1.5 font-sans text-sm text-ink-soft hover:bg-rule-soft hover:text-ink"
                  >
                    Log out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-sm px-3 py-1.5 font-sans text-sm text-ink-soft hover:text-ink"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-sm bg-ink px-3 py-1.5 font-sans text-sm font-medium text-paper-card hover:bg-[#343b4d]"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
