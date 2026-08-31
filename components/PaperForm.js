"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const EMPTY_AUTHOR = { firstName: "", lastName: "" };

export default function PaperForm({ paperId, initial }) {
  const router = useRouter();
  const [key, setKey] = useState(initial?.key || "");
  const [type, setType] = useState(initial?.type || "article");
  const [authors, setAuthors] = useState(initial?.authors?.length ? initial.authors : [EMPTY_AUTHOR]);
  const [title, setTitle] = useState(initial?.title || "");
  const [source, setSource] = useState(initial?.source || "");
  const [year, setYear] = useState(initial?.year || "");
  const [volume, setVolume] = useState(initial?.volume || "");
  const [issue, setIssue] = useState(initial?.issue || "");
  const [pages, setPages] = useState(initial?.pages || "");
  const [publisher, setPublisher] = useState(initial?.publisher || "");
  const [doi, setDoi] = useState(initial?.doi || "");
  const [url, setUrl] = useState(initial?.url || "");
  const [fileUrl, setFileUrl] = useState(initial?.fileUrl || "");
  const [abstract, setAbstract] = useState(initial?.abstract || "");
  const [tagsInput, setTagsInput] = useState((initial?.tags || []).join(", "));
  const [status, setStatus] = useState(initial?.status || "to-read");
  const [myNotes, setMyNotes] = useState(initial?.myNotes || "");
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [error, setError] = useState("");

  const [doiLookup, setDoiLookup] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const [pendingDuplicate, setPendingDuplicate] = useState(null); // { message, existing }

  const updateAuthor = (i, field, value) => {
    const next = [...authors];
    next[i] = { ...next[i], [field]: value };
    setAuthors(next);
  };
  const addAuthorRow = () => setAuthors([...authors, EMPTY_AUTHOR]);
  const removeAuthorRow = (i) => setAuthors(authors.filter((_, idx) => idx !== i));

  // --- DOI import via Crossref's public API ---
  const lookupDoi = async () => {
    const cleaned = doiLookup.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
    if (!cleaned) return;
    setLookingUp(true);
    setLookupError("");
    try {
      const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(cleaned)}`);
      if (!res.ok) throw new Error("Could not find that DOI on Crossref.");
      const data = await res.json();
      const w = data.message;
      setTitle(w.title?.[0] || "");
      setAuthors(
        (w.author || []).map((a) => ({ firstName: a.given || "", lastName: a.family || "" })) || [EMPTY_AUTHOR]
      );
      setSource(w["container-title"]?.[0] || "");
      const y = w.published?.["date-parts"]?.[0]?.[0] || w["published-print"]?.["date-parts"]?.[0]?.[0];
      if (y) setYear(String(y));
      setVolume(w.volume || "");
      setIssue(w.issue || "");
      setPages(w.page || "");
      setPublisher(w.publisher || "");
      setDoi(cleaned);
      setUrl(w.URL || `https://doi.org/${cleaned}`);
      setType(w.type === "book" ? "book" : w.type === "proceedings-article" ? "conference" : "article");
    } catch (err) {
      setLookupError(err.message);
    } finally {
      setLookingUp(false);
    }
  };

  const stateRef = useRef();
  stateRef.current = { key, type, authors, title, source, year, volume, issue, pages, publisher, doi, url, fileUrl, abstract, tagsInput, status, myNotes };

  const buildPayload = (force = false) => ({
    key: stateRef.current.key.trim().replace(/\s+/g, ""),
    type: stateRef.current.type,
    authors: stateRef.current.authors.filter((a) => a.firstName || a.lastName),
    title: stateRef.current.title.trim(),
    source: stateRef.current.source,
    year: stateRef.current.year,
    volume: stateRef.current.volume,
    issue: stateRef.current.issue,
    pages: stateRef.current.pages,
    publisher: stateRef.current.publisher,
    doi: stateRef.current.doi,
    url: stateRef.current.url,
    fileUrl: stateRef.current.fileUrl,
    abstract: stateRef.current.abstract,
    tags: stateRef.current.tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
    status: stateRef.current.status,
    myNotes: stateRef.current.myNotes,
    force,
  });

  const save = useCallback(async ({ redirect = false, force = false } = {}) => {
    if (!stateRef.current.title.trim()) {
      if (redirect) setError("Title is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(paperId ? `/api/papers/${paperId}` : "/api/papers", {
        method: paperId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(force)),
      });
      const data = await res.json();
      if (res.status === 409 && data.error === "duplicate") {
        setPendingDuplicate(data);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Could not save paper.");
      setLastSavedAt(new Date());
      if (redirect) {
        router.push(`/library/${data.paper._id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperId, router]);

  useEffect(() => {
    const handler = () => save({ redirect: !paperId });
    window.addEventListener("shortcut:save", handler);
    return () => window.removeEventListener("shortcut:save", handler);
  }, [save, paperId]);

  // Autosave only in edit mode (paper already exists).
  useEffect(() => {
    if (!paperId) return;
    const t = setTimeout(() => save(), 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, type, authors, title, source, year, volume, issue, pages, publisher, doi, url, fileUrl, abstract, tagsInput, status, myNotes, paperId]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="font-serif text-2xl font-bold">{paperId ? "Edit paper" : "Add a paper to your library"}</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink/40">
            {saving ? "Saving…" : lastSavedAt ? `Saved ${lastSavedAt.toLocaleTimeString()}` : ""}
          </span>
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

      {pendingDuplicate && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm">
          <p className="mb-2">{pendingDuplicate.message}</p>
          <div className="flex gap-2">
            <button
              onClick={() => save({ redirect: true, force: true })}
              className="rounded-md border border-amber-400 px-3 py-1.5 hover:bg-amber-100"
            >
              Save anyway
            </button>
            <button
              onClick={() => setPendingDuplicate(null)}
              className="rounded-md border border-ink/20 px-3 py-1.5 hover:bg-ink/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!paperId && (
        <div className="mb-6 rounded-lg border border-accent/20 bg-accent/5 p-4">
          <span className="text-sm font-medium text-ink/80">Import from a DOI</span>
          <div className="mt-2 flex gap-2">
            <input
              value={doiLookup}
              onChange={(e) => setDoiLookup(e.target.value)}
              placeholder="10.1038/s41586-021-03819-2 or a doi.org link"
              className="flex-1 rounded-md border border-ink/20 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={lookupDoi}
              disabled={lookingUp}
              className="rounded-md bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 disabled:opacity-60"
            >
              {lookingUp ? "Looking up…" : "Fetch"}
            </button>
          </div>
          {lookupError && <p className="text-xs text-red-600 mt-2">{lookupError}</p>}
          <p className="text-xs text-ink/50 mt-2">Fills in title, authors, journal, year, and more via Crossref.</p>
        </div>
      )}

      <div className="space-y-4">
        <Field label="Title" value={title} onChange={setTitle} required />

        <div>
          <span className="text-sm font-medium text-ink/80">Authors</span>
          <div className="space-y-2 mt-1">
            {authors.map((a, i) => (
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
                {authors.length > 1 && (
                  <button type="button" onClick={() => removeAuthorRow(i)} className="text-xs text-red-600 px-1">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addAuthorRow} className="text-xs text-accent underline">+ Add author</button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <SelectField
            label="Type"
            value={type}
            onChange={setType}
            options={["article", "book", "chapter", "website", "conference", "thesis", "report", "other"]}
          />
          <Field label="Year" value={year} onChange={setYear} />
          <Field label="Citation key" value={key} onChange={setKey} placeholder="auto-generated if left blank" hint="Used as [@key] to cite this paper." />
        </div>

        <Field label="Journal / Publisher / Site" value={source} onChange={setSource} />

        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Volume" value={volume} onChange={setVolume} />
          <Field label="Issue" value={issue} onChange={setIssue} />
          <Field label="Pages" value={pages} onChange={setPages} />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="DOI" value={doi} onChange={setDoi} placeholder="10.1000/xyz123" />
          <Field label="URL" value={url} onChange={setUrl} placeholder="https://…" />
        </div>

        <Field label="Link to PDF (Drive, Zotero, S3, etc.)" value={fileUrl} onChange={setFileUrl} placeholder="https://…" />

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Tags (comma-separated)" value={tagsInput} onChange={setTagsInput} placeholder="e.g. methods, dataset" />
          <SelectField label="Reading status" value={status} onChange={setStatus} options={["to-read", "reading", "read"]} />
        </div>

        <label className="block">
          <span className="text-sm font-medium text-ink/80">Abstract</span>
          <textarea
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-md border border-ink/20 px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink/80">Your reading notes (Markdown)</span>
          <textarea
            value={myNotes}
            onChange={(e) => setMyNotes(e.target.value)}
            rows={10}
            placeholder="Key quotes, page numbers, your own critique, how it relates to your project…"
            className="mt-1 w-full rounded-md border border-ink/20 px-3 py-2 text-sm font-mono"
          />
        </label>
      </div>
    </div>
  );
}

function Field({ label, hint, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink/80">{label}</span>
      <input
        {...props}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
      {hint && <span className="block text-xs text-ink/40 mt-0.5">{hint}</span>}
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink/80">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-ink/20 px-3 py-2 text-sm"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
