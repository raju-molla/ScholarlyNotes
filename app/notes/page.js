"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [allNotes, setAllNotes] = useState([]);
  const [q, setQ] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (query) => {
    setLoading(true);
    const res = await fetch(`/api/notes${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    const data = await res.json();
    setNotes(data.notes || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(""); }, [load]);
  useEffect(() => { fetch("/api/notes").then((r) => r.json()).then((d) => setAllNotes(d.notes || [])); }, []);

  const allTags = useMemo(() => {
    const s = new Set();
    allNotes.forEach((n) => (n.tags || []).forEach((t) => s.add(t)));
    return [...s].sort();
  }, [allNotes]);

  const onTagClick = (tag) => {
    const next = activeTag === tag ? "" : tag;
    setActiveTag(next);
    setQ(next);
    load(next);
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this note? This cannot be undone.")) return;
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    setNotes((n) => n.filter((note) => note._id !== id));
    setAllNotes((n) => n.filter((note) => note._id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="font-serif text-2xl font-bold">My notes</h1>
        <Link
          href="/notes/new"
          className="rounded-md bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90"
        >
          + New note
        </Link>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); load(q); }}
        className="mb-4"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title, tag, or project…"
          className="w-full rounded-md border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
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
      ) : notes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink/20 p-10 text-center text-ink/60">
          No notes yet. <Link href="/notes/new" className="text-accent underline">Write your first one</Link>.
        </div>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li
              key={note._id}
              className="rounded-lg border border-ink/10 p-4 flex items-center justify-between gap-4 flex-wrap hover:border-accent/40"
            >
              <div className="min-w-0">
                <Link href={`/notes/${note._id}`} className="font-serif text-lg font-semibold hover:text-accent">
                  {note.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink/50">
                  {note.project && <span className="rounded bg-ink/5 px-2 py-0.5">{note.project}</span>}
                  {(note.tags || []).map((t) => (
                    <span key={t} className="rounded bg-accent/10 text-accent px-2 py-0.5">#{t}</span>
                  ))}
                  <span>{note.citations?.length || 0} reference{note.citations?.length === 1 ? "" : "s"}</span>
                  <span>Updated {new Date(note.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/notes/${note._id}/view`}
                  className="text-sm rounded-md border border-ink/20 px-3 py-1.5 hover:bg-ink/5"
                >
                  View
                </Link>
                <Link
                  href={`/notes/${note._id}`}
                  className="text-sm rounded-md border border-ink/20 px-3 py-1.5 hover:bg-ink/5"
                >
                  Edit
                </Link>
                <button
                  onClick={() => onDelete(note._id)}
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
