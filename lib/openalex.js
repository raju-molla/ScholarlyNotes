// Shared helpers for talking to OpenAlex (https://openalex.org) — a free,
// keyless index of the scholarly record. Centralized here so every route
// that touches OpenAlex (search, related works, author lookup, bulk
// import) maps fields the same way.

const MAILTO = "scholarlynotes-app@example.com"; // OpenAlex's "polite pool" — faster, more reliable responses

export function reconstructAbstract(index) {
  if (!index) return "";
  const positions = [];
  let maxPos = 0;
  for (const word of Object.keys(index)) {
    for (const pos of index[word]) {
      positions.push([pos, word]);
      if (pos > maxPos) maxPos = pos;
    }
  }
  const arr = new Array(maxPos + 1).fill("");
  for (const [pos, word] of positions) arr[pos] = word;
  return arr.join(" ").replace(/\s+/g, " ").trim();
}

export function mapWork(w) {
  const authors = (w.authorships || []).map((a) => {
    const full = a.author?.display_name || "";
    const parts = full.trim().split(/\s+/);
    const lastName = parts.length > 1 ? parts.pop() : full;
    const firstName = parts.join(" ");
    return { firstName, lastName };
  });

  const doi = (w.doi || "").replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  const venue = w.primary_location?.source?.display_name || "";
  const landingUrl = w.primary_location?.landing_page_url || w.doi || "";
  const oaUrl = w.open_access?.oa_url || "";

  return {
    openalexId: (w.id || "").replace("https://openalex.org/", ""),
    title: w.display_name || w.title || "Untitled",
    authors,
    source: venue,
    year: w.publication_year ? String(w.publication_year) : "",
    doi,
    url: landingUrl,
    fileUrl: w.open_access?.is_oa ? oaUrl : "",
    isOA: !!w.open_access?.is_oa,
    citedBy: w.cited_by_count || 0,
    abstract: reconstructAbstract(w.abstract_inverted_index),
    type: w.type === "book" ? "book" : w.type === "proceedings-article" ? "conference" : "article",
    relatedIds: (w.related_works || []).slice(0, 10).map((id) => id.replace("https://openalex.org/", "")),
  };
}

async function openAlexFetch(path, params) {
  params.set("mailto", MAILTO);
  const res = await fetch(`https://api.openalex.org${path}?${params.toString()}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`OpenAlex returned ${res.status}`);
  return res.json();
}

export async function searchWorks(q, { page = 1, perPage = 10, oaOnly = false, sort = "relevance_score:desc", sinceDate } = {}) {
  const params = new URLSearchParams();
  params.set("search", q);
  params.set("per-page", String(perPage));
  params.set("page", String(page));
  params.set("sort", sort);
  const filters = [];
  if (oaOnly) filters.push("open_access.is_oa:true");
  if (sinceDate) filters.push(`from_publication_date:${sinceDate}`);
  if (filters.length) params.set("filter", filters.join(","));
  const data = await openAlexFetch("/works", params);
  return { results: (data.results || []).map(mapWork), count: data.meta?.count || 0 };
}

export async function getWork(openalexId) {
  const params = new URLSearchParams();
  const data = await openAlexFetch(`/works/${encodeURIComponent(openalexId)}`, params);
  return mapWork(data);
}

export async function getWorksByIds(ids) {
  if (!ids.length) return [];
  const params = new URLSearchParams();
  params.set("filter", `openalex_id:${ids.join("|")}`);
  params.set("per-page", String(Math.min(ids.length, 25)));
  const data = await openAlexFetch("/works", params);
  return (data.results || []).map(mapWork);
}

export async function searchAuthors(q, { perPage = 8 } = {}) {
  const params = new URLSearchParams();
  params.set("search", q);
  params.set("per-page", String(perPage));
  const data = await openAlexFetch("/authors", params);
  return (data.results || []).map((a) => ({
    authorId: (a.id || "").replace("https://openalex.org/", ""),
    name: a.display_name,
    institution: a.last_known_institutions?.[0]?.display_name || a.affiliations?.[0]?.institution?.display_name || "",
    worksCount: a.works_count || 0,
    citedByCount: a.cited_by_count || 0,
  }));
}

export async function getAuthorWorks(authorId, { page = 1, perPage = 25 } = {}) {
  const params = new URLSearchParams();
  params.set("filter", `author.id:${authorId}`);
  params.set("per-page", String(perPage));
  params.set("page", String(page));
  params.set("sort", "publication_date:desc");
  const data = await openAlexFetch("/works", params);
  return { results: (data.results || []).map(mapWork), count: data.meta?.count || 0 };
}
