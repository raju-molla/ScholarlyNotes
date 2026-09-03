"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function AuthorImportPage() {
  const { user, loading: authLoading } = useAuth();
  const [q, setQ] = useState("");
  const [authors, setAuthors] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [works, setWorks] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingWorks, setLoadingWorks] = useState(false);
  const [checked, setChecked] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [error, setError] = useState("");

  const searchAuthors = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await fetch(`/api/discover/authors?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAuthors(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const pickAuthor = async (author, nextPage = 1) => {
    setSelectedAuthor(author);
    setLoadingWorks(true);
    setError("");
    setImportResults(null);
    try {
      const res = await fetch(`/api/discover/author-works?authorId=${encodeURIComponent(author.authorId)}&page=${nextPage}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setWorks(nextPage === 1 ? data.results : [...works, ...data.results]);
      setCount(data.count);
      setPage(nextPage);
      if (nextPage === 1) setChecked({});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingWorks(false);
    }
  };

  const toggle = (id) => setChecked((c) => ({ ...c, [id]: !c[id] }));
  const toggleAll = () => {
    const allChecked = works.every((w) => checked[w.openalexId]);
    const next = {};
    works.forEach((w) => { next[w.openalexId] = !allChecked; });
    setChecked(next);
  };

  const importSelected = async () => {
    const items = works.filter((w) => checked[w.openalexId]);
    if (items.length === 0) return;
    setImporting(true);
    setError("");
    try {
      const res = await fetch("/api/papers/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed.");
      setImportResults(data.results);
      setChecked({});
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-ink/70">
          <Link href="/login" className="text-accent underline">Log in</Link> to bulk-import papers into your library.
        </p>
      </div>
    );
  }

  const selectedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link href="/discover" className="text-sm text-accent underline">← Back to Discover</Link>
      <h1 className="font-serif text-2xl font-bold mt-2 mb-2">Bulk-import an author's works</h1>
      <p className="text-sm text-ink/60 mb-6">
        Search for a researcher, then pick which of their papers to add straight into your library.
      </p>

      <form onSubmit={searchAuthors} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Author name…"
          className="flex-1 rounded-md border border-ink/20 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <button type="submit" disabled={searching} className="rounded-md bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 disabled:opacity-60">
          {searching ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!selectedAuthor && authors.length > 0 && (
        <ul className="mt-6 divide-y divide-ink/10 border border-ink/10 rounded-lg overflow-hidden">
          {authors.map((a) => (
            <li key={a.authorId}>
              <button
                onClick={() => pickAuthor(a)}
                className="w-full text-left px-4 py-3 hover:bg-ink/5 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="text-sm font-medium">{a.name}</div>
                  {a.institution && <div className="text-xs text-ink/50">{a.institution}</div>}
                </div>
                <div className="text-xs text-ink/40 shrink-0">{a.worksCount.toLocaleString()} works</div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedAuthor && (
        <div className="mt-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div>
              <span className="text-sm font-medium">{selectedAuthor.name}</span>
              <span className="text-xs text-ink/40 ml-2">{count.toLocaleString()} works found</span>
            </div>
            <button onClick={() => { setSelectedAuthor(null); setWorks([]); }} className="text-xs text-accent underline">
              Choose a different author
            </button>
          </div>

          {loadingWorks && works.length === 0 ? (
            <p className="text-ink/60 text-sm">Loading works…</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <button onClick={toggleAll} className="text-xs text-accent underline">
                  {works.every((w) => checked[w.openalexId]) ? "Deselect all" : "Select all"}
                </button>
                <span className="text-xs text-ink/50">{selectedCount} selected</span>
              </div>

              <ul className="divide-y divide-ink/10 border border-ink/10 rounded-lg overflow-hidden">
                {works.map((w) => (
                  <li key={w.openalexId} className="px-4 py-3 flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={!!checked[w.openalexId]}
                      onChange={() => toggle(w.openalexId)}
                      className="mt-1"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{w.title}</div>
                      <div className="text-xs text-ink/50 mt-0.5">{w.year || "—"}{w.source ? ` · ${w.source}` : ""} · {w.citedBy} citations</div>
                    </div>
                  </li>
                ))}
              </ul>

              {works.length < count && (
                <div className="text-center mt-4">
                  <button onClick={() => pickAuthor(selectedAuthor, page + 1)} disabled={loadingWorks} className="text-sm rounded-md border border-ink/20 px-4 py-1.5 hover:bg-ink/5 disabled:opacity-60">
                    {loadingWorks ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={importSelected}
                  disabled={importing || selectedCount === 0}
                  className="rounded-md bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 disabled:opacity-60"
                >
                  {importing ? "Adding…" : `Add ${selectedCount || ""} to library`}
                </button>
                <Link href="/library" className="text-sm text-accent underline">View library</Link>
              </div>

              {importResults && (
                <div className="mt-4 rounded-lg border border-ink/10 p-4 text-sm">
                  <p className="font-medium mb-2">Import complete</p>
                  <p className="text-ink/60">
                    {importResults.filter((r) => r.status === "added").length} added ·{" "}
                    {importResults.filter((r) => r.status === "duplicate").length} already in your library ·{" "}
                    {importResults.filter((r) => r.status === "error").length} skipped
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
