"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";

const STATUS_LABEL = { "to-read": "To read", reading: "Reading", read: "Read" };
const STATUS_COLOR = {
  "to-read": "bg-ink/10 text-ink/60",
  reading: "bg-accent2/10 text-accent2",
  read: "bg-accent/10 text-accent",
};

export default function LibraryPage() {
  const [papers, setPapers] = useState([]);
  const [allPapers, setAllPapers] = useState([]); // unfiltered, for stats + tag list
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (query, statusFilter) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/papers${params.toString() ? `?${params}` : ""}`);
    const data = await res.json();
    setPapers(data.papers || []);
    setLoading(false);
  }, []);

  useEffect(() => { load("", ""); }, [load]);
  useEffect(() => {
    fetch("/api/papers").then((r) => r.json()).then((d) => setAllPapers(d.papers || []));
  }, []);

  const stats = useMemo(() => ({
    total: allPapers.length,
    "to-read": allPapers.filter((p) => p.status === "to-read").length,
    reading: allPapers.filter((p) => p.status === "reading").length,
    read: allPapers.filter((p) => p.status === "read").length,
  }), [allPapers]);

  const allTags = useMemo(() => {
    const s = new Set();
    allPapers.forEach((p) => (p.tags || []).forEach((t) => s.add(t)));
    return [...s].sort();
  }, [allPapers]);

  const onSearch = (query) => { setQ(query); load(query, status); };
  const onTagClick = (tag) => {
    const next = activeTag === tag ? "" : tag;
    setActiveTag(next);
    setQ(next);
    load(next, status);
  };

  const onDelete = async (id) => {
    if (!confirm("Remove this paper from your library? This cannot be undone.")) return;
    await fetch(`/api/papers/${id}`, { method: "DELETE" });
    setPapers((p) => p.filter((paper) => paper._id !== id));
    setAllPapers((p) => p.filter((paper) => paper._id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
        <div>
          <h1 className="font-serif text-2xl font-bold">Your library</h1>
          <p className="text-sm text-ink/60 mt-1">
            Every paper you've read, with your own notes — ready to cite anywhere.
          </p>
        </div>
        <Link
          href="/library/new"
          className="rounded-md bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90"
        >
          + Add paper
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <StatPill label="Total" value={stats.total} />
        <StatPill label="To read" value={stats["to-read"]} />
        <StatPill label="Reading" value={stats.reading} />
        <StatPill label="Read" value={stats.read} />
      </div>

      <div className="flex flex-wrap gap-2 my-6">
        <form onSubmit={(e) => { e.preventDefault(); onSearch(q); }} className="flex-1 min-w-[200px]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, author, tag…"
            className="w-full rounded-md border border-ink/20 px-3 py-2"
          />
        </form>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); load(q, e.target.value); }}
          className="rounded-md border border-ink/20 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="to-read">To read</option>
          <option value="reading">Reading</option>
          <option value="read">Read</option>
        </select>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => onTagClick(t)}
              className={`text-xs rounded-full px-3 py-1 border ${
                activeTag === t ? "bg-accent text-white border-accent" : "border-ink/20 hover:bg-ink/5"
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-ink/60">Loading…</p>
      ) : papers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink/20 p-10 text-center text-ink/60">
          Your library is empty. <Link href="/library/new" className="text-accent underline">Add the first paper</Link>.
        </div>
      ) : (
        <ul className="space-y-3">
          {papers.map((p) => (
            <li key={p._id} className="rounded-lg border border-ink/10 p-4 hover:border-accent/40">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <Link href={`/library/${p._id}`} className="font-serif text-lg font-semibold hover:text-accent">
                    {p.title}
                  </Link>
                  <div className="mt-1 text-sm text-ink/60">
                    {(p.authors || []).map((a) => `${a.firstName} ${a.lastName}`.trim()).join(", ") || "Unknown author"}
                    {p.year ? ` · ${p.year}` : ""}{p.source ? ` · ${p.source}` : ""}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded px-2 py-0.5 ${STATUS_COLOR[p.status] || ""}`}>{STATUS_LABEL[p.status] || p.status}</span>
                    <span className="font-mono text-ink/40">[@{p.key}]</span>
                    {(p.tags || []).map((t) => (
                      <span key={t} className="rounded bg-accent/10 text-accent px-2 py-0.5">#{t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/library/${p._id}`} className="text-sm rounded-md border border-ink/20 px-3 py-1.5 hover:bg-ink/5">
                    Open
                  </Link>
                  <button
                    onClick={() => onDelete(p._id)}
                    className="text-sm rounded-md border border-red-200 text-red-600 px-3 py-1.5 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="rounded-md border border-ink/10 px-3 py-1.5 text-xs">
      <span className="font-semibold">{value}</span> <span className="text-ink/50">{label}</span>
    </div>
  );
}
