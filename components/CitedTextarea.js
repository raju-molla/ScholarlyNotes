"use client";

import { useState, useRef, forwardRef, useImperativeHandle } from "react";

const CitedTextarea = forwardRef(function CitedTextarea(
  { value, onChange, citations, rows = 20, placeholder, className = "" },
  ref
) {
  const [suggestions, setSuggestions] = useState([]);
  const [query, setQuery] = useState("");
  const [matchStart, setMatchStart] = useState(null);
  const textareaRef = useRef(null);

  // Exposes insertAtCursor(text) so sibling toolbars (e.g. image insert)
  // can drop text into this textarea without owning its state.
  useImperativeHandle(ref, () => ({
    insertAtCursor(text) {
      const el = textareaRef.current;
      const cursor = el ? el.selectionStart : value.length;
      const before = value.slice(0, cursor);
      const after = value.slice(cursor);
      const spacer = before && !before.endsWith("\n") ? "\n" : "";
      const newValue = `${before}${spacer}${text}\n${after}`;
      onChange(newValue);
      requestAnimationFrame(() => {
        if (!el) return;
        const pos = before.length + spacer.length + text.length + 1;
        el.focus();
        el.setSelectionRange(pos, pos);
      });
    },
    focus() {
      textareaRef.current?.focus();
    },
  }));

  const checkAutocomplete = (text, cursor) => {
    const upToCursor = text.slice(0, cursor);
    const m = upToCursor.match(/\[@([a-zA-Z0-9_-]*)$/);
    if (m) {
      const partial = m[1].toLowerCase();
      const matches = citations.filter((c) => c.key.toLowerCase().startsWith(partial)).slice(0, 6);
      setSuggestions(matches);
      setQuery(partial);
      setMatchStart(cursor - m[0].length);
    } else {
      setSuggestions([]);
      setQuery("");
      setMatchStart(null);
    }
  };

  const handleChange = (e) => {
    onChange(e.target.value);
    checkAutocomplete(e.target.value, e.target.selectionStart);
  };

  const handleCursorMove = (e) => checkAutocomplete(e.target.value, e.target.selectionStart);

  const insertCitation = (key) => {
    if (matchStart === null) return;
    const el = textareaRef.current;
    const cursor = el.selectionStart;
    const before = value.slice(0, matchStart);
    const after = value.slice(cursor);
    const newValue = `${before}[@${key}]${after}`;
    onChange(newValue);
    setSuggestions([]);
    setMatchStart(null);
    requestAnimationFrame(() => {
      const pos = before.length + key.length + 3; // "[@" + key + "]"
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyUp={handleCursorMove}
        onClick={handleCursorMove}
        rows={rows}
        placeholder={placeholder}
        className={className}
      />
      {suggestions.length > 0 && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white dark:bg-[#1c2124] border border-ink/20 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((c) => (
            <button
              type="button"
              key={c.key}
              onMouseDown={(e) => { e.preventDefault(); insertCitation(c.key); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent/10 flex items-center gap-2"
            >
              <span className="font-mono text-accent shrink-0">[@{c.key}]</span>
              <span className="text-ink/60 truncate">{c.title}</span>
            </button>
          ))}
        </div>
      )}
      {suggestions.length === 0 && query && matchStart !== null && (
        <p className="text-xs text-ink/40 mt-1">No matching references for &ldquo;{query}&rdquo;.</p>
      )}
    </div>
  );
});

export default CitedTextarea;
