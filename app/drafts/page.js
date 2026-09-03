"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { daysUntil } from "@/components/DraftEditor";

function wordCount(text) {
  return (text || "").trim().split(/\s+/).filter(Boolean).length;
}

function draftProgress(draft) {
  const targets = draft.targets || {};
  const targetEntries = Object.entries(targets).filter(([, v]) => v);
  if (targetEntries.length === 0) return null;
  const targetSum = targetEntries.reduce((sum, [, v]) => sum + Number(v), 0);
  const actualSum = (draft.sections || [])
    .filter((s) => targets[s.key])
    .reduce((sum, s) => sum + wordCount(s.content), 0);
  if (targetSum === 0) return null;
  return Math.min(100, Math.round((actualSum / targetSum) * 100));
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState([]);
  const [allDrafts, setAllDrafts] = useState([]);
  const [q, setQ] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (query) => {
    setLoading(true);
    const res = await fetch(`/api/drafts${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    const data = await res.json();
    setDrafts(data.drafts || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(""); }, [load]);
  useEffect(() => { fetch("/api/drafts").then((r) => r.json()).then((d) => setAllDrafts(d.drafts || [])); }, []);

  const allTags = useMemo(() => {
    const s = new Set();
    allDrafts.forEach((d) => (d.tags || []).forEach((t) => s.add(t)));
    return [...s].sort();
  }, [allDrafts]);

  const onTagClick = (tag) => {
    const next = activeTag === tag ? "" : tag;
    setActiveTag(next);
    setQ(next);
    load(next);
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this paper draft? This cannot be undone.")) return;
    await fetch(`/api/drafts/${id}`, { method: "DELETE" });
    setDrafts((d) => d.filter((draft) => draft._id !== id));
    setAllDrafts((d) => d.filter((draft) => draft._id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
        <div>
          <h1 className="font-serif text-2xl font-bold">Paper drafts</h1>
          <p className="text-sm text-ink/60 mt-1">
            Full research papers, structured section by section — with citations pulled from your library.
          </p>
        </div>
        <Link
          href="/drafts/new"
          className="rounded-md bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90"
        >
          + New paper
        </Link>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); load(q); }} className="my-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title, project, or tag…"
          className="w-full rounded-md border border-ink/20 px-3 py-2"
        />
      </form>

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
      ) : drafts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink/20 p-10 text-center text-ink/60">
          No paper drafts yet. <Link href="/drafts/new" className="text-accent underline">Start your first paper</Link>.
        </div>
      ) : (
        <ul className="space-y-3">
          {drafts.map((d) => (
            <li key={d._id} className="rounded-lg border border-ink/10 p-4 flex items-center justify-between gap-4 flex-wrap hover:border-accent/40">
              <div className="min-w-0">
                <Link href={`/drafts/${d._id}`} className="font-serif text-lg font-semibold hover:text-accent">
                  {d.title}
                </Link>
                {d.subtitle && <p className="text-sm text-ink/60">{d.subtitle}</p>}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink/50">
                  {d.project && <span className="rounded bg-ink/5 px-2 py-0.5">{d.project}</span>}
                  {(d.tags || []).map((t) => (
                    <span key={t} className="rounded bg-accent/10 text-accent px-2 py-0.5">#{t}</span>
                  ))}
                  <span>{d.citations?.length || 0} reference{d.citations?.length === 1 ? "" : "s"}</span>
                  <span>Updated {new Date(d.updatedAt).toLocaleDateString()}</span>
                </div>
                {(d.targetVenue || d.deadline) && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {d.targetVenue && <span className="rounded bg-ink/5 px-2 py-0.5 text-ink/60">Targeting {d.targetVenue}</span>}
                    {d.deadline && <DeadlinePill deadline={d.deadline} />}
                  </div>
                )}
                <ProgressBar percent={draftProgress(d)} />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/drafts/${d._id}/view`} className="text-sm rounded-md border border-ink/20 px-3 py-1.5 hover:bg-ink/5">
                  View
                </Link>
                <Link href={`/drafts/${d._id}`} className="text-sm rounded-md border border-ink/20 px-3 py-1.5 hover:bg-ink/5">
                  Edit
                </Link>
                <button
                  onClick={() => onDelete(d._id)}
                  className="text-sm rounded-md border border-red-200 text-red-600 px-3 py-1.5 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DeadlinePill({ deadline }) {
  const days = daysUntil(deadline);
  if (days === null) return null;
  const overdue = days < 0;
  const soon = days >= 0 && days <= 7;
  const color = overdue ? "bg-red-50 text-red-700" : soon ? "bg-amber-50 text-amber-700" : "bg-ink/5 text-ink/60";
  const label = overdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`;
  return <span className={`rounded px-2 py-0.5 ${color}`}>{label}</span>;
}

function ProgressBar({ percent }) {
  if (percent === null) return null;
  return (
    <div className="mt-2 h-1.5 w-full max-w-xs rounded-full bg-ink/10 overflow-hidden">
      <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
    </div>
  );
}
