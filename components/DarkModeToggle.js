"use client";

import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("rn_theme");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const initial = stored ? stored === "dark" : !!prefersDark;
    setDark(initial);
    document.documentElement.classList.toggle("dark", initial);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("rn_theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="rounded-md border border-ink/20 dark:border-white/20 w-8 h-8 flex items-center justify-center text-sm hover:bg-ink/5 dark:hover:bg-white/10"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
