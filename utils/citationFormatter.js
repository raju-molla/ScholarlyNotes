// Formats a single citation object into a reference-list entry string
// for the given style, plus helpers for in-text citations, BibTeX export,
// and a small dependency-free Markdown renderer.

function authorsAPA(authors) {
  if (!authors || authors.length === 0) return "";
  const fmt = (a) => {
    const initial = a.firstName ? `${a.firstName.trim()[0]}.` : "";
    return `${a.lastName}, ${initial}`.trim();
  };
  if (authors.length === 1) return fmt(authors[0]);
  if (authors.length === 2) return `${fmt(authors[0])}, & ${fmt(authors[1])}`;
  const allButLast = authors.slice(0, -1).map(fmt).join(", ");
  return `${allButLast}, & ${fmt(authors[authors.length - 1])}`;
}

function authorsMLA(authors) {
  if (!authors || authors.length === 0) return "";
  const first = authors[0];
  const firstFmt = `${first.lastName}, ${first.firstName}`.trim();
  if (authors.length === 1) return firstFmt;
  if (authors.length === 2) {
    const second = authors[1];
    return `${firstFmt}, and ${second.firstName} ${second.lastName}`.trim();
  }
  return `${firstFmt}, et al.`;
}

function authorsChicago(authors) {
  if (!authors || authors.length === 0) return "";
  const first = authors[0];
  const firstFmt = `${first.lastName}, ${first.firstName}`.trim();
  if (authors.length === 1) return firstFmt;
  const rest = authors.slice(1).map((a) => `${a.firstName} ${a.lastName}`.trim()).join(", ");
  return `${firstFmt}, and ${rest}`;
}

function authorsHarvard(authors) {
  if (!authors || authors.length === 0) return "";
  const fmt = (a) => `${a.lastName}, ${a.firstName ? a.firstName.trim()[0] + "." : ""}`.trim();
  if (authors.length === 1) return fmt(authors[0]);
  if (authors.length === 2) return `${fmt(authors[0])} and ${fmt(authors[1])}`;
  return `${fmt(authors[0])} et al.`;
}

function authorsIEEEVancouver(authors) {
  if (!authors || authors.length === 0) return "";
  const fmt = (a) => `${a.firstName ? a.firstName.trim()[0] + ". " : ""}${a.lastName}`.trim();
  return authors.map(fmt).join(", ");
}

export const CITATION_STYLES = [
  { value: "apa", label: "APA" },
  { value: "mla", label: "MLA" },
  { value: "chicago", label: "Chicago" },
  { value: "harvard", label: "Harvard" },
  { value: "ieee", label: "IEEE" },
  { value: "vancouver", label: "Vancouver" },
];

export const NUMBERED_STYLES = ["ieee", "vancouver"];

export function formatCitation(c, style = "apa", number = null) {
  const year = c.year || "n.d.";
  switch (style) {
    case "mla": {
      const authors = authorsMLA(c.authors);
      let entry = authors ? `${authors}. ` : "";
      entry += `"${c.title}."`;
      if (c.source) entry += ` *${c.source}*,`;
      const details = [c.volume && `vol. ${c.volume}`, c.issue && `no. ${c.issue}`, year, c.pages && `pp. ${c.pages}`]
        .filter(Boolean).join(", ");
      if (details) entry += ` ${details}.`;
      if (c.url) entry += ` ${c.url}.`;
      return entry.trim();
    }
    case "chicago": {
      const authors = authorsChicago(c.authors);
      let entry = authors ? `${authors}. ` : "";
      entry += `"${c.title}."`;
      if (c.source) entry += ` *${c.source}*`;
      const details = [c.volume, c.issue && `no. ${c.issue}`, `(${year})`, c.pages && `: ${c.pages}`]
        .filter(Boolean).join(" ");
      if (details) entry += ` ${details}.`;
      if (c.doi) entry += ` https://doi.org/${c.doi}.`;
      else if (c.url) entry += ` ${c.url}.`;
      return entry.trim();
    }
    case "harvard": {
      const authors = authorsHarvard(c.authors);
      let entry = authors ? `${authors} ` : "";
      entry += `(${year}) '${c.title}'`;
      if (c.source) entry += `, *${c.source}*`;
      if (c.volume) entry += `, vol. ${c.volume}`;
      if (c.issue) entry += `(${c.issue})`;
      if (c.pages) entry += `, pp. ${c.pages}`;
      entry += ".";
      if (c.doi) entry += ` doi: ${c.doi}.`;
      else if (c.url) entry += ` Available at: ${c.url}.`;
      return entry.trim();
    }
    case "ieee": {
      const authors = authorsIEEEVancouver(c.authors);
      const prefix = number ? `[${number}] ` : "";
      let entry = `${prefix}${authors ? authors + ", " : ""}"${c.title},"`;
      if (c.source) entry += ` *${c.source}*,`;
      const details = [c.volume && `vol. ${c.volume}`, c.issue && `no. ${c.issue}`, c.pages && `pp. ${c.pages}`, year]
        .filter(Boolean).join(", ");
      if (details) entry += ` ${details}.`;
      if (c.doi) entry += ` doi: ${c.doi}.`;
      return entry.trim();
    }
    case "vancouver": {
      const authors = authorsIEEEVancouver(c.authors);
      const prefix = number ? `${number}. ` : "";
      let entry = `${prefix}${authors ? authors + ". " : ""}${c.title}.`;
      if (c.source) entry += ` ${c.source}.`;
      const details = [year, c.volume && `;${c.volume}`, c.issue && `(${c.issue})`, c.pages && `:${c.pages}`]
        .filter(Boolean).join("");
      if (details) entry += ` ${details}.`;
      return entry.trim();
    }
    case "apa":
    default: {
      const authors = authorsAPA(c.authors);
      let entry = authors ? `${authors} ` : "";
      entry += `(${year}). ${c.title}.`;
      if (c.source) {
        entry += ` *${c.source}*`;
        if (c.volume) {
          entry += `, *${c.volume}*`;
          if (c.issue) entry += `(${c.issue})`;
        }
        if (c.pages) entry += `, ${c.pages}`;
        entry += ".";
      } else if (c.publisher) {
        entry += ` ${c.publisher}.`;
      }
      if (c.doi) entry += ` https://doi.org/${c.doi}`;
      else if (c.url) entry += ` ${c.url}`;
      return entry.trim();
    }
  }
}

// In-text marker. Author-date styles use (Smith, 2021); numbered styles
// (IEEE, Vancouver) use [n], where n is the citation's position in the
// document's numbering map (order of first appearance).
export function formatInText(c, style = "apa", number = null) {
  if (NUMBERED_STYLES.includes(style) && number) return `[${number}]`;
  const last = c.authors && c.authors[0] ? c.authors[0].lastName : c.source || "Unknown";
  const suffix = c.authors && c.authors.length > 1 ? " et al." : "";
  return `(${last}${suffix}, ${c.year || "n.d."})`;
}

// Sort references alphabetically by first author's last name (author-date
// styles). Numbered styles instead keep the order citations first appear —
// use buildAppearanceOrder + numberMap for those.
export function sortedCitations(citations) {
  return [...citations].sort((a, b) => {
    const aKey = (a.authors?.[0]?.lastName || a.title || "").toLowerCase();
    const bKey = (b.authors?.[0]?.lastName || b.title || "").toLowerCase();
    return aKey.localeCompare(bKey);
  });
}

// Scans one or more content strings (in document order) for [@key] tokens
// and returns { key: number } in order of first appearance, for numbered
// citation styles.
export function buildNumberMap(contents, citations) {
  const validKeys = new Set(citations.map((c) => c.key));
  const seen = [];
  for (const content of contents) {
    const matches = (content || "").matchAll(/\[@([a-zA-Z0-9_-]+)\]/g);
    for (const m of matches) {
      if (validKeys.has(m[1]) && !seen.includes(m[1])) seen.push(m[1]);
    }
  }
  // Any cited-but-unreferenced-in-text entries go at the end, in list order.
  for (const c of citations) if (!seen.includes(c.key)) seen.push(c.key);
  const map = {};
  seen.forEach((key, i) => { map[key] = i + 1; });
  return map;
}

// Returns citations in the right order for the reference list: numeric
// order (by first appearance) for IEEE/Vancouver, alphabetical otherwise.
export function orderedReferenceList(citations, style, numberMap) {
  if (NUMBERED_STYLES.includes(style) && numberMap) {
    return [...citations].sort((a, b) => (numberMap[a.key] || 999) - (numberMap[b.key] || 999));
  }
  return sortedCitations(citations);
}

// Replaces [@key] tokens in markdown content with formatted in-text
// citations, linking them to the reference list via anchor ids.
export function resolveInTextCitations(content, citations, style = "apa", numberMap = null) {
  const byKey = Object.fromEntries(citations.map((c) => [c.key, c]));
  return (content || "").replace(/\[@([a-zA-Z0-9_-]+)\]/g, (match, key) => {
    const c = byKey[key];
    if (!c) return match; // leave unresolved tokens untouched
    const number = numberMap ? numberMap[key] : null;
    return `[${formatInText(c, style, number)}](#ref-${encodeURIComponent(key)})`;
  });
}

// --- BibTeX export ---

function bibEntryType(type) {
  switch (type) {
    case "book": return "book";
    case "chapter": return "incollection";
    case "conference": return "inproceedings";
    case "thesis": return "phdthesis";
    case "report": return "techreport";
    case "website": return "misc";
    default: return "article";
  }
}

export function formatBibTeX(c) {
  const authorStr = (c.authors || []).map((a) => `${a.lastName}, ${a.firstName}`.trim()).join(" and ");
  const lines = [`@${bibEntryType(c.type)}{${c.key},`];
  if (authorStr) lines.push(`  author  = {${authorStr}},`);
  if (c.title) lines.push(`  title   = {${c.title}},`);
  if (c.source) lines.push(`  journal = {${c.source}},`);
  if (c.year) lines.push(`  year    = {${c.year}},`);
  if (c.volume) lines.push(`  volume  = {${c.volume}},`);
  if (c.issue) lines.push(`  number  = {${c.issue}},`);
  if (c.pages) lines.push(`  pages   = {${c.pages}},`);
  if (c.publisher) lines.push(`  publisher = {${c.publisher}},`);
  if (c.doi) lines.push(`  doi     = {${c.doi}},`);
  if (c.url) lines.push(`  url     = {${c.url}},`);
  lines.push("}");
  return lines.join("\n");
}

export function formatBibliography(citations) {
  return citations.map(formatBibTeX).join("\n\n");
}

// --- Figures ---

// Replaces clean placeholders like "[Figure 2: Dashboard screenshot]" (the
// text after the colon is just a writer's reminder and is ignored) with the
// actual image, resolved against the note/draft's `figures` array — so the
// editor never has to show a raw base64 data URI inline. The caption shown
// in the rendered page always comes from `figures`, not the placeholder text.
export function resolveFigures(content, figures) {
  if (!figures || figures.length === 0) return content || "";
  return (content || "").replace(/\[Figure\s+(\d+)(?::[^\]]*)?\]/gi, (match, numStr) => {
    const fig = figures[parseInt(numStr, 10) - 1];
    if (!fig || !fig.src) return match;
    return `![${fig.caption || `Figure ${numStr}`}](${fig.src})`;
  });
}

// --- Minimal Markdown -> HTML renderer ---

export function markdownToHtml(md) {
  if (!md) return "";
  const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lines = escapeHtml(md).split("\n");
  let html = "";
  let inList = false;
  let inQuote = false;

  const inline = (text) =>
    text
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-md my-3 max-w-full mx-auto block" />')
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  for (const rawLine of lines) {
    const line = rawLine;
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    const listItem = line.match(/^[-*]\s+(.*)$/);
    const quote = line.match(/^>\s?(.*)$/);

    if (heading) {
      if (inList) { html += "</ul>"; inList = false; }
      if (inQuote) { html += "</blockquote>"; inQuote = false; }
      const level = heading[1].length;
      html += `<h${level}>${inline(heading[2])}</h${level}>`;
    } else if (listItem) {
      if (inQuote) { html += "</blockquote>"; inQuote = false; }
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${inline(listItem[1])}</li>`;
    } else if (quote) {
      if (inList) { html += "</ul>"; inList = false; }
      if (!inQuote) { html += "<blockquote>"; inQuote = true; }
      html += `<p>${inline(quote[1])}</p>`;
    } else if (line.trim() === "") {
      if (inList) { html += "</ul>"; inList = false; }
      if (inQuote) { html += "</blockquote>"; inQuote = false; }
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      if (inQuote) { html += "</blockquote>"; inQuote = false; }
      html += `<p>${inline(line)}</p>`;
    }
  }
  if (inList) html += "</ul>";
  if (inQuote) html += "</blockquote>";
  return html;
}
