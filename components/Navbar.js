"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import DarkModeToggle from "./DarkModeToggle";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const links = user
    ? [
        { href: "/discover", label: "Discover" },
        { href: "/library", label: "Library" },
        { href: "/drafts", label: "Drafts" },
        { href: "/notes", label: "Notes" },
        { href: "/search", label: "Search" },
        { href: "/digests", label: "Digests" },
        ...(user.role === "admin" ? [{ href: "/admin", label: "Admin", accent: true }] : []),
      ]
    : [];

  return (
    <header className="border-b border-ink/10 bg-paper/95 backdrop-blur sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl font-bold tracking-tight" onClick={() => setOpen(false)}>
          Scholarly<span className="text-accent">Notes</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4 text-sm">
          {!loading && user && (
            <>
              {links.map((l) => (
                <Link key={l.href} href={l.href} className={`hover:text-accent ${l.accent ? "text-accent2 font-medium" : ""}`}>
                  {l.label}
                </Link>
              ))}
              <span className="text-ink/40">|</span>
              <Link href="/profile" className="text-ink/70 hover:text-accent">{user.name}</Link>
              <button onClick={logout} className="rounded-md border border-ink/20 px-3 py-1 hover:bg-ink/5">
                Log out
              </button>
            </>
          )}
          {!loading && !user && (
            <>
              <Link href="/discover" className="hover:text-accent">Discover</Link>
              <Link href="/login" className="hover:text-accent">Log in</Link>
              <Link href="/signup" className="rounded-md bg-accent text-white px-3 py-1.5 hover:bg-accent/90">
                Sign up
              </Link>
            </>
          )}
          <DarkModeToggle />
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <DarkModeToggle />
          {!loading && user && (
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
              className="w-9 h-9 rounded-md border border-ink/20 flex items-center justify-center"
            >
              {open ? "✕" : "☰"}
            </button>
          )}
          {!loading && !user && (
            <>
              <Link href="/discover" className="text-sm hover:text-accent">Discover</Link>
              <Link href="/login" className="text-sm hover:text-accent">Log in</Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu panel */}
      {open && !loading && user && (
        <nav className="md:hidden border-t border-ink/10 px-4 py-3 flex flex-col gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`py-2 ${l.accent ? "text-accent2 font-medium" : ""}`}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/profile" onClick={() => setOpen(false)} className="py-2 border-t border-ink/10 mt-1 pt-3">
            {user.name} — Profile
          </Link>
          <button
            onClick={() => { setOpen(false); logout(); }}
            className="mt-2 rounded-md border border-ink/20 px-3 py-2 text-left"
          >
            Log out
          </button>
        </nav>
      )}
    </header>
  );
}
