"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState({ notes: [], papers: [], drafts: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const runSearch = useCallback(async (query) => {
    if (!query.trim()) { setResults({ notes: [], papers: [], drafts: [] }); return; }
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data);
    setLoading(false);
  }, []);

  const onChange = (value) => {
    setQ(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), 300);
  };

  const total = results.notes.length + results.papers.length + results.drafts.length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-serif text-2xl font-bold mb-4">Search everything</h1>
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search your notes, library, and drafts…"
        className="w-full rounded-md border border-ink/20 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
      <p className="text-xs text-ink/40 mt-2">Tip: press Ctrl/Cmd+K anywhere to jump here.</p>

      {loading && <p className="mt-6 text-ink/60">Searching…</p>}

      {!loading && q.trim() && total === 0 && (
        <p className="mt-6 text-ink/60">No results for &ldquo;{q}&rdquo;.</p>
      )}

      {!loading && results.papers.length > 0 && (
        <ResultGroup title="Library">
          {results.papers.map((p) => (
            <ResultRow key={p._id} href={`/library/${p._id}`} title={p.title} meta={`${p.source || ""} ${p.year || ""}`.trim()} />
          ))}
        </ResultGroup>
      )}

      {!loading && results.notes.length > 0 && (
        <ResultGroup title="Notes">
          {results.notes.map((n) => (
            <ResultRow key={n._id} href={`/notes/${n._id}`} title={n.title} meta={n.project} />
          ))}
        </ResultGroup>
      )}

      {!loading && results.drafts.length > 0 && (
        <ResultGroup title="Paper drafts">
          {results.drafts.map((d) => (
            <ResultRow key={d._id} href={`/drafts/${d._id}`} title={d.title} meta={d.subtitle || d.project} />
          ))}
        </ResultGroup>
      )}
    </div>
  );
}

function ResultGroup({ title, children }) {
  return (
    <div className="mt-8">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-2">{title}</h2>
      <ul className="divide-y divide-ink/10 border border-ink/10 rounded-lg overflow-hidden">{children}</ul>
    </div>
  );
}

function ResultRow({ href, title, meta }) {
  return (
    <li>
      <Link href={href} className="block px-4 py-3 hover:bg-ink/5">
        <div className="font-serif font-medium">{title}</div>
        {meta && <div className="text-xs text-ink/50 mt-0.5">{meta}</div>}
      </Link>
    </li>
  );
}
