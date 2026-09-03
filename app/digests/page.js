"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DigestsPage() {
  const [queries, setQueries] = useState(null); // null = loading
  const [runState, setRunState] = useState({}); // id -> "running" | message
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/saved-queries")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setQueries(data.queries || []);
      })
      .catch(() => setError("Could not load your saved searches."));
  }, []);

  const remove = async (id) => {
    if (!confirm("Stop following this search?")) return;
    await fetch(`/api/saved-queries/${id}`, { method: "DELETE" });
    setQueries((qs) => qs.filter((q) => q._id !== id));
  };

  const runNow = async (id) => {
    setRunState((s) => ({ ...s, [id]: "running" }));
    try {
      const res = await fetch(`/api/saved-queries/${id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send digest.");
      setRunState((s) => ({ ...s, [id]: data.sent ? `Sent — ${data.count} new result${data.count === 1 ? "" : "s"}` : data.message }));
    } catch (err) {
      setRunState((s) => ({ ...s, [id]: err.message }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-serif text-2xl font-bold mb-2">Digests</h1>
      <p className="text-sm text-ink/60 mb-6">
        Searches you're following from <Link href="/discover" className="text-accent underline">Discover</Link>. Once a
        server-side weekly job is running (see the README), you'll get an email whenever something new matches.
      </p>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {queries === null ? (
        <p className="text-ink/60">Loading…</p>
      ) : queries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink/20 p-10 text-center text-ink/60">
          No saved searches yet. Search on <Link href="/discover" className="text-accent underline">Discover</Link> and
          use "Save this search for a weekly digest".
        </div>
      ) : (
        <ul className="space-y-3">
          {queries.map((q) => (
            <li key={q._id} className="rounded-lg border border-ink/10 p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="font-medium text-sm">&ldquo;{q.query}&rdquo;{q.oaOnly ? " · open access only" : ""}</div>
                <div className="text-xs text-ink/40 mt-1">
                  {q.lastRunAt ? `Last checked ${new Date(q.lastRunAt).toLocaleDateString()}` : "Never checked yet"}
                </div>
                {runState[q._id] && (
                  <div className="text-xs text-accent2 mt-1">
                    {runState[q._id] === "running" ? "Sending…" : runState[q._id]}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => runNow(q._id)}
                  disabled={runState[q._id] === "running"}
                  className="text-xs rounded-md border border-ink/20 px-3 py-1.5 hover:bg-ink/5 disabled:opacity-60"
                >
                  Send test digest now
                </button>
                <button
                  onClick={() => remove(q._id)}
                  className="text-xs rounded-md border border-red-200 text-red-600 px-3 py-1.5 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
