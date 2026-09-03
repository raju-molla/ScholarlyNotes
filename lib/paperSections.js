// The default starting structure for a new paper draft, in reading order.
// "implementation" sits after Methodology, before Results/Discussion — a
// natural spot for describing a built system, model, or experimental
// apparatus that realizes the methodology. Users can add further custom
// sections in the editor beyond this starting set, or remove any of these.
export const DEFAULT_SECTIONS = [
  { key: "abstract", label: "Abstract", hint: "A brief summary of the paper: problem, method, key findings, and conclusion." },
  { key: "introduction", label: "Introduction", hint: "The research question, background, motivation, and a roadmap of the paper." },
  { key: "literatureReview", label: "Literature Review", hint: "Summarize prior work and show how this research extends or differs from it." },
  { key: "methodology", label: "Methodology", hint: "Research design: how data/evidence was collected and analyzed." },
  { key: "implementation", label: "Implementation", hint: "Concrete details of what was built or run: system, model, pipeline, tools, configuration." },
  { key: "results", label: "Results", hint: "Findings, reported without interpretation." },
  { key: "discussion", label: "Discussion", hint: "Interpret the results, discuss implications, limitations, and critical analysis." },
  { key: "conclusion", label: "Conclusion", hint: "Restate the question and main findings; discuss significance and future work." },
];

const HINT_BY_KEY = Object.fromEntries(DEFAULT_SECTIONS.map((s) => [s.key, s.hint]));

export function hintFor(key) {
  return HINT_BY_KEY[key] || "A custom section you added — written entirely in your own words.";
}

// Builds the initial section list for a brand-new draft.
export function createDefaultSections() {
  return DEFAULT_SECTIONS.map((s) => ({ key: s.key, label: s.label, content: "", custom: false }));
}

// Turns a user-typed section title into a short, unique, URL/DB-safe key.
export function slugifyKey(label, existingKeys = []) {
  const base = label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "section";
  let candidate = base;
  let i = 1;
  while (existingKeys.includes(candidate)) {
    i += 1;
    candidate = `${base}-${i}`;
  }
  return candidate;
}
