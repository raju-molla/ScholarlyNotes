"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CitationManager from "./CitationManager";
import CitedTextarea from "./CitedTextarea";
import HistoryPanel from "./HistoryPanel";
import FigureManager from "./FigureManager";
import AIAssistPanel from "./AIAssistPanel";
import { CITATION_STYLES } from "@/utils/citationFormatter";

export default function NoteEditor({ noteId, initial }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title || "Untitled note");
  const [project, setProject] = useState(initial?.project || "");
  const [tagsInput, setTagsInput] = useState((initial?.tags || []).join(", "));
  const [content, setContent] = useState(initial?.content || "");
  const [citationStyle, setCitationStyle] = useState(initial?.citationStyle || "apa");
  const [citations, setCitations] = useState(initial?.citations || []);
  const [figures, setFigures] = useState(initial?.figures || []);
  const [history, setHistory] = useState(initial?.history || []);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [error, setError] = useState("");
  const bodyTextareaRef = useRef(null);

  const stateRef = useRef();
  stateRef.current = { title, project, tagsInput, content, citationStyle, citations, figures };

  const buildPayload = () => ({
    title: stateRef.current.title.trim() || "Untitled note",
    project: stateRef.current.project.trim(),
    tags: stateRef.current.tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
    content: stateRef.current.content,
    citationStyle: stateRef.current.citationStyle,
    citations: stateRef.current.citations,
    figures: stateRef.current.figures,
  });

  const save = useCallback(async ({ redirect = false } = {}) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(noteId ? `/api/notes/${noteId}` : "/api/notes", {
        method: noteId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save note.");
      setLastSavedAt(new Date());
      if (data.note?.history) setHistory(data.note.history);
      if (redirect) {
        router.push(`/notes/${data.note._id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [noteId, router]);

  // Cmd/Ctrl+S shortcut, dispatched globally by KeyboardShortcuts.
  useEffect(() => {
    const handler = () => save({ redirect: !noteId });
    window.addEventListener("shortcut:save", handler);
    return () => window.removeEventListener("shortcut:save", handler);
  }, [save, noteId]);

  // Autosave: only once the note exists (has an id), 2s after the last edit.
  useEffect(() => {
    if (!noteId) return;
    const t = setTimeout(() => save(), 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, project, tagsInput, content, citationStyle, citations, figures, noteId]);

  const restoreVersion = (entry) => {
    if (confirm("Replace the current body with this earlier version? You can still Save or discard afterward.")) {
      setContent(entry.content || "");
    }
  };

  const aiContext = {
    paperTitle: title,
    project,
    citations: citations.map((c) => ({
      key: c.key,
      authors: (c.authors || []).map((a) => `${a.firstName} ${a.lastName}`.trim()).filter(Boolean).join(", "),
      title: c.title,
      year: c.year,
    })),
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="font-serif text-2xl font-bold bg-transparent focus:outline-none w-full mr-4"
          placeholder="Note title"
        />
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-ink/40">
            {saving ? "Saving…" : lastSavedAt ? `Saved ${lastSavedAt.toLocaleTimeString()}` : ""}
          </span>
          {noteId && (
            <Link href={`/notes/${noteId}/view`} className="rounded-md border border-ink/20 px-4 py-2 text-sm hover:bg-ink/5">
              Preview
            </Link>
          )}
          <button
            onClick={() => save({ redirect: true })}
            disabled={saving}
            className="rounded-md bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <label className="block">
          <span className="text-xs font-medium text-ink/70">Project</span>
          <input value={project} onChange={(e) => setProject(e.target.value)} className="mt-1 w-full rounded-md border border-ink/20 px-2 py-1.5 text-sm" placeholder="e.g. Thesis ch. 2" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-ink/70">Tags (comma-separated)</span>
          <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="mt-1 w-full rounded-md border border-ink/20 px-2 py-1.5 text-sm" placeholder="e.g. neuroscience, methods" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-ink/70">Citation style</span>
          <select value={citationStyle} onChange={(e) => setCitationStyle(e.target.value)} className="mt-1 w-full rounded-md border border-ink/20 px-2 py-1.5 text-sm">
            {CITATION_STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <span className="text-xs font-medium text-ink/70">
            Body (Markdown supported: **bold**, *italic*, # headings, - lists, &gt; quotes).
            Type <code className="bg-ink/5 px-1 rounded">[@</code> to search and insert a citation.
          </span>
          <div className="mt-1">
            <CitedTextarea
              ref={bodyTextareaRef}
              value={content}
              onChange={setContent}
              citations={citations}
              rows={24}
              className="w-full rounded-md border border-ink/20 px-3 py-3 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/40"
              placeholder={"Start writing your notes...\n\nFor example: Recent work shows strong evidence for this effect [@smith2021]."}
            />
          </div>
          <div className="mt-3">
            <AIAssistPanel
              text={content}
              sectionLabel="note"
              context={aiContext}
              onApply={(result, mode) => {
                if (mode === "replace") setContent(result);
                else setContent(content ? `${content}\n\n${result}` : result);
              }}
            />
          </div>
        </div>
        <div className="space-y-4">
          <CitationManager citations={citations} onChange={setCitations} />
          <FigureManager
            figures={figures}
            onChange={setFigures}
            onInsertPlaceholder={(text) => bodyTextareaRef.current?.insertAtCursor(text)}
          />
          <HistoryPanel history={history} onRestore={restoreVersion} previewFn={(e) => (e.content || "").slice(0, 60)} />
        </div>
      </div>
    </div>
  );
}
