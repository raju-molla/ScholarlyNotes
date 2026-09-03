"use client";

import { useEffect, useState } from "react";

export default function RelatedPapers({ openalexId }) {
  const [results, setResults] = useState(null); // null = loading
  const [error, setError] = useState("");
  const [addState, setAddState] = useState({});

  useEffect(() => {
    if (!openalexId) return;
    let cancelled = false;
    fetch(`/api/discover/related?id=${encodeURIComponent(openalexId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) setError(data.error);
        else setResults(data.results || []);
      })
      .catch(() => !cancelled && setError("Could not load related papers."));
    return () => { cancelled = true; };
  }, [openalexId]);

  const addToLibrary = async (work) => {
    setAddState((s) => ({ ...s, [work.openalexId]: "adding" }));
    try {
      const res = await fetch("/api/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: work.type,
          authors: work.authors,
          title: work.title,
          source: work.source,
          year: work.year,
          doi: work.doi,
          url: work.url,
          fileUrl: work.fileUrl,
          abstract: work.abstract,
          openalexId: work.openalexId,
          status: "to-read",
        }),
      });
      const data = await res.json();
      if (!res.ok && data.error !== "duplicate") throw new Error(data.error || "Could not add.");
      setAddState((s) => ({ ...s, [work.openalexId]: data.error === "duplicate" ? "duplicate" : "added" }));
    } catch {
      setAddState((s) => ({ ...s, [work.openalexId]: "error" }));
    }
  };

  if (!openalexId) return null;
  if (error) return null; // fail quietly — this is a nice-to-have panel
  if (results === null) {
    return <div className="rounded-lg border border-ink/10 p-4 text-sm text-ink/40">Loading related papers…</div>;
  }
  if (results.length === 0) return null;

  return (
    <div className="rounded-lg border border-ink/10 p-4">
      <h3 className="text-sm font-semibold text-ink/80 mb-3">Related papers</h3>
      <ul className="space-y-3">
        {results.map((w) => {
          const state = addState[w.openalexId];
          const authorNames = w.authors.slice(0, 3).map((a) => `${a.firstName} ${a.lastName}`.trim()).filter(Boolean).join(", ") || "Unknown authors";
          return (
            <li key={w.openalexId} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <a href={w.url || undefined} target="_blank" rel="noopener" className="text-sm font-medium hover:text-accent">
                  {w.title}
                </a>
                <div className="text-xs text-ink/50 mt-0.5">{authorNames} · {w.year || "—"}</div>
              </div>
              <div className="shrink-0">
                {state === "added" && <span className="text-xs text-accent2">Added ✓</span>}
                {state === "duplicate" && <span className="text-xs text-ink/40">Already saved</span>}
                {state === "adding" && <span className="text-xs text-ink/40">Adding…</span>}
                {(!state || state === "error") && (
                  <button
                    onClick={() => addToLibrary(w)}
                    className="text-xs rounded-md border border-ink/20 px-2.5 py-1 hover:bg-ink/5 whitespace-nowrap"
                  >
                    {state === "error" ? "Retry" : "Add to library"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
