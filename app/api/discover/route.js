import { NextResponse } from "next/server";
import { searchWorks } from "@/lib/openalex";

// Discover papers via OpenAlex — a free, open index of 250M+ scholarly
// works (no key required). We proxy server-side rather than calling it
// from the browser so the API surface stays consistent with the rest of
// the app's /api routes.

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const oaOnly = searchParams.get("oa") === "1";

  if (!q) return NextResponse.json({ results: [], count: 0 });

  try {
    const { results, count } = await searchWorks(q, { page, perPage: 10, oaOnly });
    return NextResponse.json({ results, count });
  } catch (err) {
    return NextResponse.json({ error: "Could not reach the search index. Try again shortly." }, { status: 502 });
  }
}
