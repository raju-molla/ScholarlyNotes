"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        router.push("/search");
      } else if (e.key.toLowerCase() === "s") {
        // Only intercept when a save handler is actually listening
        // (editor pages register one); otherwise let the browser act normally.
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("shortcut:save"));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return null;
}
