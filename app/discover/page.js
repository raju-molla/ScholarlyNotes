"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function DiscoverPage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [oaOnly, setOaOnly] = useState(false);
  const [results, setResults] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [addState, setAddState] = useState({}); // openalexId -> "adding" | "added" | { dup: message } | "error"
  const [saveState, setSaveState] = useState(""); // "" | "saving" | "saved" | "error"
  const inputRef = useRef(null);

  const runSearch = async (nextPage = 1) => {
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/discover?q=${encodeURIComponent(q.trim())}&page=${nextPage}${oaOnly ? "&oa=1" : ""}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed.");
      setResults(nextPage === 1 ? data.results : [...results, ...data.results]);
      setCount(data.count);
      setPage(nextPage);
      setSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToLibrary = async (work, force = false) => {
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
          force,
        }),
      });
      const data = await res.json();
      if (res.status === 409 && data.error === "duplicate") {
        setAddState((s) => ({ ...s, [work.openalexId]: { dup: data } }));
        return;
      }
      if (!res.ok) throw new Error(data.error || "Could not add to library.");
      setAddState((s) => ({ ...s, [work.openalexId]: "added" }));
    } catch (err) {
      setAddState((s) => ({ ...s, [work.openalexId]: "error" }));
    }
  };

  const saveSearch = async () => {
    if (!q.trim()) return;
    setSaveState("saving");
    try {
      const res = await fetch("/api/saved-queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q.trim(), oaOnly }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save this search.");
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
        <h1 className="font-serif text-2xl font-bold">Discover</h1>
        <Link href="/discover/author" className="text-sm text-accent underline whitespace-nowrap">
          Bulk-import an author's works →
        </Link>
      </div>
      <p className="text-sm text-ink/60 mb-6">
        Search the open scholarly record and add anything straight to your library — title, authors, and abstract come
        pre-filled, ready to cite as <code className="text-xs bg-ink/5 px-1 rounded">[@key]</code>.
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); runSearch(1); }}
        className="flex gap-2"
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setSaveState(""); }}
          placeholder="Search by title, topic, or author…"
          className="flex-1 rounded-md border border-ink/20 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-accent text-white px-5 py-2 text-sm font-medium hover:bg-accent/90 disabled:opacity-60"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      <label className="mt-3 flex items-center gap-2 text-sm text-ink/60">
        <input type="checkbox" checked={oaOnly} onChange={(e) => setOaOnly(e.target.checked)} />
        Open access only
      </label>

      {user && q.trim() && (
        <div className="mt-2">
          {saveState === "saved" ? (
            <span className="text-xs text-accent2">Saved — you'll get a digest email when there's something new. Manage in <Link href="/digests" className="underline">Digests</Link>.</span>
          ) : (
            <button onClick={saveSearch} disabled={saveState === "saving"} className="text-xs text-accent underline disabled:opacity-50">
              {saveState === "saving" ? "Saving…" : saveState === "error" ? "Couldn't save — try again" : "Save this search for a weekly digest"}
            </button>
          )}
        </div>
      )}

      {!user && (
        <p className="mt-4 text-xs text-ink/50">
          You can search without an account, but{" "}
          <Link href="/login" className="text-accent underline">log in</Link> to add papers to a library.
        </p>
      )}

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {!loading && searched && results.length === 0 && !error && (
        <p className="mt-8 text-ink/60">No results for &ldquo;{q}&rdquo;.</p>
      )}

      {results.length > 0 && (
        <>
          <p className="mt-8 text-xs text-ink/40">{count.toLocaleString()} result{count === 1 ? "" : "s"}</p>
          <ul className="divide-y divide-ink/10 border border-ink/10 rounded-lg overflow-hidden mt-2">
            {results.map((w) => (
              <ResultRow key={w.openalexId} work={w} user={user} state={addState[w.openalexId]} onAdd={addToLibrary} />
            ))}
          </ul>

          {results.length < count && (
            <div className="text-center mt-6">
              <button
                onClick={() => runSearch(page + 1)}
                disabled={loading}
                className="rounded-md border border-ink/20 px-5 py-2 text-sm hover:bg-ink/5 disabled:opacity-60"
              >
                {loading ? "Loading…" : "Show more"}
              </button>
            </div>
          )}
        </>
      )}

      <p className="mt-10 text-xs text-ink/40 leading-relaxed">
        Powered by <a href="https://openalex.org" target="_blank" rel="noopener" className="underline">OpenAlex</a>, an
        open index of the scholarly record. Some results link to a free full text; others link to the publisher, which
        may sit behind a paywall.
      </p>
    </div>
  );
}

function ResultRow({ work, user, state, onAdd }) {
  const authorNames = work.authors
    .slice(0, 4)
    .map((a) => `${a.firstName} ${a.lastName}`.trim())
    .filter(Boolean)
    .join(", ") || "Unknown authors";

  return (
    <li className="px-4 py-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <a
            href={work.url || undefined}
            target="_blank"
            rel="noopener"
            className="font-serif font-medium hover:text-accent"
          >
            {work.title}
          </a>
          <div className="text-xs text-ink/50 mt-0.5">
            {authorNames} · {work.year || "—"}{work.source ? ` · ${work.source}` : ""}
          </div>
          {work.abstract && (
            <p className="text-sm text-ink/60 mt-2 line-clamp-3">{work.abstract}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-ink/40">
            <span>{work.citedBy} citation{work.citedBy === 1 ? "" : "s"}</span>
            {work.isOA && <span className="text-accent2">open access</span>}
          </div>
        </div>

        <div className="shrink-0">
          <AddButton work={work} user={user} state={state} onAdd={onAdd} />
        </div>
      </div>

      {state?.dup && (
        <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs">
          <p className="mb-2">{state.dup.message}</p>
          <div className="flex gap-2">
            <button
              onClick={() => onAdd(work, true)}
              className="rounded-md border border-amber-400 px-2.5 py-1 hover:bg-amber-100"
            >
              Add anyway
            </button>
            <Link href={`/library/${state.dup.existing.id}`} className="rounded-md border border-ink/20 px-2.5 py-1 hover:bg-ink/5">
              View existing
            </Link>
          </div>
        </div>
      )}
    </li>
  );
}

function AddButton({ work, user, state, onAdd }) {
  if (!user) {
    return (
      <Link href="/login" className="rounded-md border border-ink/20 px-3 py-1.5 text-xs hover:bg-ink/5 whitespace-nowrap">
        Log in to add
      </Link>
    );
  }
  if (state === "added") {
    return <span className="text-xs text-accent2 font-medium whitespace-nowrap">Added ✓</span>;
  }
  if (state === "adding") {
    return <span className="text-xs text-ink/40 whitespace-nowrap">Adding…</span>;
  }
  if (state === "error") {
    return (
      <button onClick={() => onAdd(work)} className="text-xs text-red-600 underline whitespace-nowrap">
        Failed — retry
      </button>
    );
  }
  return (
    <button
      onClick={() => onAdd(work)}
      className="rounded-md bg-accent text-white px-3 py-1.5 text-xs font-medium hover:bg-accent/90 whitespace-nowrap"
    >
      Add to library
    </button>
  );
}
