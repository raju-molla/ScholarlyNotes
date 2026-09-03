"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CitationManager from "./CitationManager";
import CitedTextarea from "./CitedTextarea";
import HistoryPanel from "./HistoryPanel";
import FigureManager from "./FigureManager";
import AIAssistPanel from "./AIAssistPanel";
import { createDefaultSections, slugifyKey, hintFor } from "@/lib/paperSections";
import { CITATION_STYLES } from "@/utils/citationFormatter";

function wordCount(text) {
  return (text || "").trim().split(/\s+/).filter(Boolean).length;
}

export default function DraftEditor({ draftId, initial }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title || "Untitled paper");
  const [subtitle, setSubtitle] = useState(initial?.subtitle || "");
  const [project, setProject] = useState(initial?.project || "");
  const [tagsInput, setTagsInput] = useState((initial?.tags || []).join(", "));
  const [citationStyle, setCitationStyle] = useState(initial?.citationStyle || "apa");
  const [targetVenue, setTargetVenue] = useState(initial?.targetVenue || "");
  const [deadline, setDeadline] = useState(initial?.deadline ? initial.deadline.slice(0, 10) : "");
  const [citations, setCitations] = useState(initial?.citations || []);
  const [figures, setFigures] = useState(initial?.figures || []);
  const [sections, setSections] = useState(
    initial?.sections?.length ? initial.sections : createDefaultSections()
  );
  const [targets, setTargets] = useState(initial?.targets || {});
  const [history, setHistory] = useState(initial?.history || []);
  const [activeSection, setActiveSection] = useState(sections[0]?.key);
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState("");
  const activeTextareaRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [error, setError] = useState("");

  const updateSection = (key, value) =>
    setSections((prev) => prev.map((s) => (s.key === key ? { ...s, content: value } : s)));
  const updateTarget = (key, value) => setTargets((t) => ({ ...t, [key]: value ? Number(value) : undefined }));

  const addSection = () => {
    const label = newSectionLabel.trim();
    if (!label) return;
    const key = slugifyKey(label, sections.map((s) => s.key));
    setSections((prev) => [...prev, { key, label, content: "", custom: true }]);
    setActiveSection(key);
    setNewSectionLabel("");
    setAddingSection(false);
  };

  const removeSection = () => {
    if (sections.length <= 1) {
      alert("A paper needs at least one section.");
      return;
    }
    if (!confirm(`Remove the "${sections.find((s) => s.key === activeSection)?.label}" section? Its text will be lost once you save.`)) return;
    const idx = sections.findIndex((s) => s.key === activeSection);
    const next = sections.filter((s) => s.key !== activeSection);
    setSections(next);
    setActiveSection(next[Math.max(0, idx - 1)]?.key || next[0]?.key);
  };

  const stateRef = useRef();
  stateRef.current = { title, subtitle, project, tagsInput, citationStyle, citations, sections, targets, figures, targetVenue, deadline };

  const buildPayload = () => ({
    title: stateRef.current.title.trim() || "Untitled paper",
    subtitle: stateRef.current.subtitle.trim(),
    project: stateRef.current.project.trim(),
    tags: stateRef.current.tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
    citationStyle: stateRef.current.citationStyle,
    citations: stateRef.current.citations,
    sections: stateRef.current.sections,
    targets: stateRef.current.targets,
    figures: stateRef.current.figures,
    targetVenue: stateRef.current.targetVenue.trim(),
    deadline: stateRef.current.deadline || null,
  });

  const save = useCallback(async ({ redirect = false } = {}) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(draftId ? `/api/drafts/${draftId}` : "/api/drafts", {
        method: draftId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save paper.");
      setLastSavedAt(new Date());
      if (data.draft?.history) setHistory(data.draft.history);
      if (redirect) {
        router.push(`/drafts/${data.draft._id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [draftId, router]);

  useEffect(() => {
    const handler = () => save({ redirect: !draftId });
    window.addEventListener("shortcut:save", handler);
    return () => window.removeEventListener("shortcut:save", handler);
  }, [save, draftId]);

  useEffect(() => {
    if (!draftId) return;
    const t = setTimeout(() => save(), 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, subtitle, project, tagsInput, citationStyle, citations, sections, targets, figures, targetVenue, deadline, draftId]);

  const restoreVersion = (entry) => {
    if (confirm("Replace all sections with this earlier version? You can still Save or discard afterward.")) {
      const restored = entry.sections || createDefaultSections();
      setSections(restored);
      if (!restored.some((s) => s.key === activeSection)) setActiveSection(restored[0]?.key);
    }
  };

  const active = sections.find((s) => s.key === activeSection) || sections[0];
  const activeWords = wordCount(active?.content);
  const activeTarget = targets[activeSection];

  // Context handed to the AI so it can write with awareness of the whole
  // paper — title, other sections already written, and the real reference
  // list — instead of refusing for lack of context or inventing citations.
  const aiContext = {
    paperTitle: title,
    paperSubtitle: subtitle,
    project,
    otherSections: sections.filter((s) => s.key !== activeSection).map((s) => ({ label: s.label, content: s.content })),
    citations: citations.map((c) => ({
      key: c.key,
      authors: (c.authors || []).map((a) => `${a.firstName} ${a.lastName}`.trim()).filter(Boolean).join(", "),
      title: c.title,
      year: c.year,
    })),
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div className="flex-1 min-w-[280px]">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-serif text-2xl font-bold bg-transparent focus:outline-none w-full"
            placeholder="Paper title"
          />
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="text-sm text-ink/60 bg-transparent focus:outline-none w-full mt-1"
            placeholder="Subtitle (optional)"
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-ink/40">
            {saving ? "Saving…" : lastSavedAt ? `Saved ${lastSavedAt.toLocaleTimeString()}` : ""}
          </span>
          {draftId && (
            <Link href={`/drafts/${draftId}/view`} className="rounded-md border border-ink/20 px-4 py-2 text-sm hover:bg-ink/5">
              Preview full paper
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
          <input value={project} onChange={(e) => setProject(e.target.value)} className="mt-1 w-full rounded-md border border-ink/20 px-2 py-1.5 text-sm" placeholder="e.g. PhD thesis ch. 3" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-ink/70">Tags (comma-separated)</span>
          <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="mt-1 w-full rounded-md border border-ink/20 px-2 py-1.5 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-ink/70">Citation style</span>
          <select value={citationStyle} onChange={(e) => setCitationStyle(e.target.value)} className="mt-1 w-full rounded-md border border-ink/20 px-2 py-1.5 text-sm">
            {CITATION_STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-ink/70">Target venue (optional)</span>
          <input value={targetVenue} onChange={(e) => setTargetVenue(e.target.value)} className="mt-1 w-full rounded-md border border-ink/20 px-2 py-1.5 text-sm" placeholder="e.g. NeurIPS 2027" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-ink/70">Submission deadline (optional)</span>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1 w-full rounded-md border border-ink/20 px-2 py-1.5 text-sm" />
        </label>
        {deadline && <DeadlineBadge deadline={deadline} />}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Section navigator: horizontal scrolling pills on small screens, a sticky vertical list on large screens */}
        <div className="lg:col-span-1">
          <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {sections.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setActiveSection(s.key)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs border whitespace-nowrap ${
                  activeSection === s.key ? "bg-accent text-white border-accent" : "border-ink/20 hover:bg-ink/5"
                }`}
              >
                {s.label} · {wordCount(s.content)}w
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAddingSection((o) => !o)}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs border border-dashed border-accent/40 text-accent whitespace-nowrap"
            >
              + Add section
            </button>
          </div>
          <div className="hidden lg:block rounded-lg border border-ink/10 overflow-hidden sticky top-20">
            {sections.map((s) => {
              const w = wordCount(s.content);
              const t = targets[s.key];
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setActiveSection(s.key)}
                  className={`w-full text-left px-3 py-2.5 text-sm border-b border-ink/10 ${
                    activeSection === s.key ? "bg-accent/10 text-accent font-medium" : "hover:bg-ink/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{s.label}</span>
                    <span className="text-xs text-ink/40">{w}{t ? `/${t}` : ""}w</span>
                  </div>
                  {t > 0 && (
                    <div className="mt-1 h-1 rounded bg-ink/10 overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${Math.min(100, Math.round((w / t) * 100))}%` }} />
                    </div>
                  )}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setAddingSection((o) => !o)}
              className="w-full text-left px-3 py-2.5 text-sm text-accent hover:bg-accent/5"
            >
              + Add section
            </button>
          </div>
          {addingSection && (
            <div className="mt-2 flex gap-2">
              <input
                autoFocus
                value={newSectionLabel}
                onChange={(e) => setNewSectionLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addSection(); }}
                placeholder="Section title, e.g. Limitations"
                className="flex-1 rounded-md border border-ink/20 px-2 py-1.5 text-sm"
              />
              <button type="button" onClick={addSection} className="rounded-md bg-accent text-white px-3 py-1.5 text-xs font-medium hover:bg-accent/90">
                Add
              </button>
            </div>
          )}
        </div>

        {/* Active section editor */}
        <div className="lg:col-span-2">
          <div className="mb-2 flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-serif text-xl font-semibold">{active?.label}</h2>
              <p className="text-xs text-ink/50 mt-0.5">{hintFor(active?.key)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs text-ink/60 flex items-center gap-1">
                Target
                <input
                  type="number"
                  min="0"
                  value={activeTarget || ""}
                  onChange={(e) => updateTarget(activeSection, e.target.value)}
                  placeholder="words"
                  className="w-20 rounded border border-ink/20 px-1.5 py-1"
                />
              </label>
              <button type="button" onClick={removeSection} className="text-xs text-red-600 underline">
                Remove section
              </button>
            </div>
          </div>
          <CitedTextarea
            ref={activeTextareaRef}
            value={active?.content || ""}
            onChange={(v) => updateSection(activeSection, v)}
            citations={citations}
            rows={20}
            className="w-full rounded-md border border-ink/20 px-3 py-3 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/40"
            placeholder={`Write the ${active?.label || "section"} here… Markdown supported. Type [@ to cite.`}
          />
          <div className="text-xs text-ink/50 mt-1 mb-3">
            {activeWords} word{activeWords === 1 ? "" : "s"}
            {activeTarget ? ` of ${activeTarget} target` : ""}
          </div>
          <AIAssistPanel
            text={active?.content || ""}
            sectionLabel={active?.label || "section"}
            context={aiContext}
            onApply={(result, mode) => {
              if (mode === "replace") updateSection(activeSection, result);
              else updateSection(activeSection, active?.content ? `${active.content}\n\n${result}` : result);
            }}
          />
        </div>

        {/* Citations + figures + history sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <CitationManager citations={citations} onChange={setCitations} />
          <FigureManager
            figures={figures}
            onChange={setFigures}
            onInsertPlaceholder={(text) => activeTextareaRef.current?.insertAtCursor(text)}
          />
          <HistoryPanel
            history={history}
            onRestore={restoreVersion}
            previewFn={(e) => (e.sections || []).map((s) => s.content).find(Boolean)?.slice(0, 60) || "—"}
          />
        </div>
      </div>
    </div>
  );
}

export function daysUntil(deadline) {
  if (!deadline) return null;
  const target = new Date(deadline);
  if (isNaN(target.getTime())) return null;
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const ms = targetMidnight - todayMidnight;
  return Math.round(ms / 86400000);
}

function DeadlineBadge({ deadline }) {
  const days = daysUntil(deadline);
  if (days === null) return null;
  const overdue = days < 0;
  const soon = days >= 0 && days <= 7;
  const color = overdue ? "bg-red-50 text-red-700 border-red-200" : soon ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-ink/5 text-ink/60 border-ink/10";
  const label = overdue ? `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue` : days === 0 ? "Due today" : `${days} day${days === 1 ? "" : "s"} left`;
  return (
    <div className="sm:col-span-3">
      <span className={`inline-block text-xs rounded-full px-3 py-1 border ${color}`}>{label}</span>
    </div>
  );
}
