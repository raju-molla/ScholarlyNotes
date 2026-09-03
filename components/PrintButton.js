"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-md border border-ink/20 px-4 py-2 text-sm hover:bg-ink/5"
    >
      Print / Save as PDF
    </button>
  );
}
