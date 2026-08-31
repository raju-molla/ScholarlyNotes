"use client";

import { useState } from "react";

export default function HistoryPanel({ history, onRestore, previewFn }) {
  const [open, setOpen] = useState(false);
  if (!history || history.length === 0) return null;

  const reversed = [...history].reverse();

  return (
    <div className="rounded-lg border border-ink/10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium"
      >
        <span>Version history ({history.length})</span>
        <span className="text-ink/40">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <ul className="border-t border-ink/10 divide-y divide-ink/10 max-h-64 overflow-y-auto">
          {reversed.map((entry, i) => (
            <li key={i} className="px-4 py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-ink/60">
                  {new Date(entry.savedAt).toLocaleString(undefined, {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </div>
                {previewFn && <div className="text-xs text-ink/40 truncate">{previewFn(entry)}</div>}
              </div>
              <button
                type="button"
                onClick={() => onRestore(entry)}
                className="text-xs shrink-0 rounded border border-accent/40 text-accent px-2 py-1 hover:bg-accent/10"
              >
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
