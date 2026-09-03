"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatBibTeX } from "@/utils/citationFormatter";

const EMPTY = {
  key: "",
  type: "article",
  authors: [{ firstName: "", lastName: "" }],
  title: "",
  source: "",
  year: "",
  volume: "",
  issue: "",
  pages: "",
  publisher: "",
  doi: "",
  url: "",
};

export default function CitationManager({ citations, onChange }) {
  const [draft, setDraft] = useState(EMPTY);
  const [editingIndex, setEditingIndex] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [library, setLibrary] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryQuery, setLibraryQuery] = useState("");

  useEffect(() => {
    if (!showLibrary) return;
    let cancelled = false;
    setLibraryLoading(true);
    fetch(`/api/papers${libraryQuery ? `?q=${encodeURIComponent(libraryQuery)}` : ""}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setLibrary(data.papers || []); })
      .finally(() => { if (!cancelled) setLibraryLoading(false); });
    return () => { cancelled = true; };
  }, [showLibrary, libraryQuery]);

  const importFromLibrary = (paper) => {
    if (citations.some((c) => c.key === paper.key)) {
      alert("That paper is already cited in this document.");
      return;
    }
    const {
      key, type, authors, title, source, year, volume, issue, pages, publisher, doi, url,
    } = paper;
    onChange([...citations, { key, type, authors, title, source, year, volume, issue, pages, publisher, doi, url }]);
  };

  const resetDraft = () => {
    setDraft(EMPTY);
    setEditingIndex(null);
  };

  const updateAuthor = (i, field, value) => {
    const authors = [...draft.authors];
    authors[i] = { ...authors[i], [field]: value };
    setDraft({ ...draft, authors });
  };

  const addAuthorRow = () => setDraft({ ...draft, authors: [...draft.authors, { firstName: "", lastName: "" }] });
  const removeAuthorRow = (i) => setDraft({ ...draft, authors: draft.authors.filter((_, idx) => idx !== i) });

  const saveCitation = () => {
    if (!draft.key.trim() || !draft.title.trim()) {
      alert("A citation needs at least a key (e.g. smith2021) and a title.");
      return;
    }
    const cleaned = { ...draft, authors: draft.authors.filter((a) => a.firstName || a.lastName) };
    let next;
    if (editingIndex !== null) {
      next = citations.map((c, i) => (i === editingIndex ? cleaned : c));
    } else {
      if (citations.some((c) => c.key === cleaned.key)) {
        alert("That citation key is already used in this note. Choose a unique key.");
        return;
      }
      next = [...citations, cleaned];
    }
    onChange(next);
    resetDraft();
    setExpanded(false);
  };

  const editCitation = (i) => {
    setDraft({ ...EMPTY, ...citations[i], authors: citations[i].authors.length ? citations[i].authors : [{ firstName: "", lastName: "" }] });
    setEditingIndex(i);
    setExpanded(true);
  };

  const removeCitation = (i) => {
    onChange(citations.filter((_, idx) => idx !== i));
  };

  return (
    <div className="rounded-lg border border-ink/10 p-4">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h3 className="font-serif font-semibold">References ({citations.length})</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setShowLibrary((s) => !s); setExpanded(false); }}
            className="text-sm rounded-md border border-accent/40 text-accent px-3 py-1 hover:bg-accent/5"
          >
            {showLibrary ? "Close library" : "Cite from library"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (expanded) resetDraft();
              setExpanded((e) => !e);
              setShowLibrary(false);
            }}
            className="text-sm rounded-md border border-ink/20 px-3 py-1 hover:bg-ink/5"
          >
            {expanded ? "Cancel" : "+ Add manually"}
          </button>
        </div>
      </div>

      {showLibrary && (
        <div className="mb-4 border border-accent/20 rounded-md p-3 bg-accent/5">
          <input
            value={libraryQuery}
            onChange={(e) => setLibraryQuery(e.target.value)}
            placeholder="Search your library by title, tag, or author…"
            className="w-full rounded-md border border-ink/20 px-2 py-1.5 text-sm mb-2"
          />
          {libraryLoading ? (
            <p className="text-xs text-ink/50">Loading…</p>
          ) : library.length === 0 ? (
            <p className="text-xs text-ink/50">
              No papers found. <Link href="/library/new" className="text-accent underline">Add one to your library</Link>.
            </p>
          ) : (
            <ul className="max-h-56 overflow-y-auto divide-y divide-ink/10">
              {library.map((p) => (
                <li key={p._id} className="py-1.5 flex items-center justify-between gap-2">
                  <span className="text-xs text-ink/80 truncate">
                    <span className="font-mono text-accent">[@{p.key}]</span>{" "}
                    {p.authors?.[0]?.lastName || "—"} ({p.year || "n.d."}) — {p.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => importFromLibrary(p)}
                    className="text-xs shrink-0 rounded border border-accent/40 text-accent px-2 py-0.5 hover:bg-accent/10"
                  >
                    Cite
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {citations.length > 0 && (
        <ul className="mb-3 divide-y divide-ink/10">
          {citations.map((c, i) => (
            <li key={c.key + i} className="py-2 flex items-start justify-between gap-3">
              <div className="text-sm min-w-0">
                <span className="font-mono text-accent">[@{c.key}]</span>{" "}
                <span className="text-ink/80">
                  {c.authors?.map((a) => `${a.lastName}`).filter(Boolean).join(", ") || "—"} ({c.year || "n.d."}) — {c.title}
                </span>
              </div>
              <div className="flex gap-2 shrink-0 text-xs">
                <button onClick={() => navigator.clipboard.writeText(formatBibTeX(c))} className="underline hover:text-accent">BibTeX</button>
                <button onClick={() => editCitation(i)} className="underline hover:text-accent">Edit</button>
                <button onClick={() => removeCitation(i)} className="underline text-red-600">Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {expanded && (
        <div className="space-y-3 border-t border-ink/10 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Citation key"
              value={draft.key}
              onChange={(v) => setDraft({ ...draft, key: v.replace(/\s+/g, "") })}
              placeholder="smith2021"
              hint="Type [@smith2021] in your note to cite it."
            />
            <SelectField
              label="Type"
              value={draft.type}
              onChange={(v) => setDraft({ ...draft, type: v })}
              options={["article", "book", "chapter", "website", "conference", "thesis", "report", "other"]}
            />
          </div>

          <div>
            <span className="text-sm font-medium text-ink/80">Authors</span>
            <div className="space-y-2 mt-1">
              {draft.authors.map((a, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    placeholder="First name"
                    value={a.firstName}
                    onChange={(e) => updateAuthor(i, "firstName", e.target.value)}
                    className="flex-1 rounded-md border border-ink/20 px-2 py-1.5 text-sm"
                  />
                  <input
                    placeholder="Last name"
                    value={a.lastName}
                    onChange={(e) => updateAuthor(i, "lastName", e.target.value)}
                    className="flex-1 rounded-md border border-ink/20 px-2 py-1.5 text-sm"
                  />
                  {draft.authors.length > 1 && (
                    <button type="button" onClick={() => removeAuthorRow(i)} className="text-xs text-red-600 px-1">✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addAuthorRow} className="text-xs text-accent underline">+ Add author</button>
            </div>
          </div>

          <TextField label="Title" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Journal / Publisher / Site" value={draft.source} onChange={(v) => setDraft({ ...draft, source: v })} />
            <TextField label="Year" value={draft.year} onChange={(v) => setDraft({ ...draft, year: v })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <TextField label="Volume" value={draft.volume} onChange={(v) => setDraft({ ...draft, volume: v })} />
            <TextField label="Issue" value={draft.issue} onChange={(v) => setDraft({ ...draft, issue: v })} />
            <TextField label="Pages" value={draft.pages} onChange={(v) => setDraft({ ...draft, pages: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="DOI" value={draft.doi} onChange={(v) => setDraft({ ...draft, doi: v })} placeholder="10.1000/xyz123" />
            <TextField label="URL" value={draft.url} onChange={(v) => setDraft({ ...draft, url: v })} placeholder="https://…" />
          </div>

          <button
            type="button"
            onClick={saveCitation}
            className="rounded-md bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90"
          >
            {editingIndex !== null ? "Save changes" : "Add reference"}
          </button>
        </div>
      )}
    </div>
  );
}

function TextField({ label, hint, ...props }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink/70">{label}</span>
      <input
        {...props}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-ink/20 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
      {hint && <span className="block text-[11px] text-ink/40 mt-0.5">{hint}</span>}
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink/70">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-ink/20 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
