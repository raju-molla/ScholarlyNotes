"use client";

import { useState } from "react";
import { formatBibliography } from "@/utils/citationFormatter";

export default function CopyBibliographyButton({ citations }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(formatBibliography(citations));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={copy}
      className="text-xs rounded-md border border-ink/20 px-3 py-1.5 hover:bg-ink/5"
    >
      {copied ? "Copied!" : "Copy as BibTeX"}
    </button>
  );
}
