"use client";

import { useState, useRef } from "react";

const MAX_BYTES = 4 * 1024 * 1024; // 4MB — keeps MongoDB documents reasonably sized

export default function FigureManager({ figures, onChange, onInsertPlaceholder }) {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const addFigure = (src) => {
    const label = caption.trim() || `Figure ${figures.length + 1}`;
    const next = [...figures, { caption: label, src }];
    onChange(next);
    onInsertPlaceholder(`[Figure ${next.length}: ${label}]`);
    setCaption("");
    setUrl("");
    setError("");
    setOpen(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const addFromUrl = () => {
    if (!url.trim()) return;
    addFigure(url.trim());
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (file.size > MAX_BYTES) {
      setError("That image is over 4MB — use an image URL instead for large files.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => addFigure(reader.result);
    reader.onerror = () => setError("Could not read that file.");
    reader.readAsDataURL(file);
  };

  const removeFigure = (i) => {
    if (!confirm("Remove this figure? Any [Figure N] placeholder already in your text that points to it (or later figures) will need updating by hand.")) return;
    onChange(figures.filter((_, idx) => idx !== i));
  };

  return (
    <div className="rounded-lg border border-ink/10 p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-serif font-semibold">Figures ({figures.length})</h3>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-sm rounded-md border border-ink/20 px-3 py-1 hover:bg-ink/5"
        >
          {open ? "Cancel" : "🖼 Insert image"}
        </button>
      </div>

      {figures.length > 0 && (
        <ul className="mb-3 divide-y divide-ink/10">
          {figures.map((f, i) => (
            <li key={i} className="py-2 flex items-center justify-between gap-2">
              <div className="text-sm min-w-0 truncate">
                <span className="font-mono text-accent">Figure {i + 1}</span>{" "}
                <span className="text-ink/70">{f.caption}</span>
              </div>
              <div className="flex gap-2 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => onInsertPlaceholder(`[Figure ${i + 1}: ${f.caption}]`)}
                  className="underline hover:text-accent"
                >
                  Insert
                </button>
                <button type="button" onClick={() => removeFigure(i)} className="underline text-red-600">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="space-y-2 border-t border-ink/10 pt-3">
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption / title (e.g. Dashboard screenshot)"
            className="w-full rounded-md border border-ink/20 px-2 py-1.5 text-sm"
          />
          <div className="flex gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Image URL — https://…"
              className="flex-1 rounded-md border border-ink/20 px-2 py-1.5 text-sm"
            />
            <button type="button" onClick={addFromUrl} className="rounded-md bg-accent text-white px-3 py-1.5 text-xs font-medium hover:bg-accent/90">
              Add
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink/40">or</span>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="text-xs" />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <p className="text-xs text-ink/40">
            Drops a clean placeholder like <code className="bg-ink/5 px-1 rounded">[Figure 1: Caption]</code> at your
            cursor — the actual image only appears in the rendered page, never as raw data in the editor.
          </p>
        </div>
      )}
    </div>
  );
}
