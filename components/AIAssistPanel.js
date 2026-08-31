"use client";

import { useState } from "react";

const ACTIONS = [
  { value: "expand", label: "Expand this text" },
  { value: "fix_grammar", label: "Fix grammar & clarity" },
  { value: "generate", label: "Generate from a prompt" },
];

export default function AIAssistPanel({ text, sectionLabel, onApply, context }) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState("expand");
  const [instructions, setInstructions] = useState("");
  const [targetWords, setTargetWords] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          text,
          instructions,
          targetWords: targetWords ? Number(targetWords) : undefined,
          sectionLabel,
          context,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed.");
      setResult(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const apply = (mode) => {
    onApply(result, mode);
    setResult("");
  };

  return (
    <div className="rounded-lg border border-accent/20 bg-accent/5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-accent"
      >
        <span>✨ AI writing assist</span>
        <span className="text-ink/40">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="border-t border-accent/20 p-3 space-y-2">
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full rounded-md border border-ink/20 px-2 py-1.5 text-sm"
          >
            {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>

          {action === "generate" && (
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder={`Optional — anything extra beyond the paper's title, other sections, and references (already used automatically). e.g. "Emphasize the gap in prior work."`}
              className="w-full rounded-md border border-ink/20 px-2 py-1.5 text-sm"
            />
          )}

          <input
            type="number"
            min="0"
            value={targetWords}
            onChange={(e) => setTargetWords(e.target.value)}
            placeholder="Target word count (optional)"
            className="w-full rounded-md border border-ink/20 px-2 py-1.5 text-sm"
          />

          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="w-full rounded-md bg-accent text-white py-1.5 text-sm font-medium hover:bg-accent/90 disabled:opacity-60"
          >
            {loading ? "Thinking…" : "Generate"}
          </button>

          {error && <p className="text-xs text-red-600">{error}</p>}

          {result && (
            <div className="mt-2">
              <div className="text-xs text-ink/50 mb-1">Suggestion — review before applying:</div>
              <div className="max-h-56 overflow-y-auto rounded-md border border-ink/10 p-2 text-sm bg-white dark:bg-[#1c2124] whitespace-pre-wrap">
                {result}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <button type="button" onClick={() => apply("replace")} className="text-xs rounded border border-accent/40 text-accent px-2 py-1 hover:bg-accent/10">
                  Replace section
                </button>
                <button type="button" onClick={() => apply("append")} className="text-xs rounded border border-ink/20 px-2 py-1 hover:bg-ink/5">
                  Append to section
                </button>
                <button type="button" onClick={() => setResult("")} className="text-xs rounded border border-ink/20 px-2 py-1 hover:bg-ink/5">
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
