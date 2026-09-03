import { NextResponse } from "next/server";
import { getWork, getWorksByIds } from "@/lib/openalex";

// Given an OpenAlex work ID, return the papers OpenAlex considers related —
// used on a library paper's page to suggest what to read next.

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = (searchParams.get("id") || "").trim();
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  try {
    const work = await getWork(id);
    const related = await getWorksByIds(work.relatedIds);
    return NextResponse.json({ results: related });
  } catch (err) {
    return NextResponse.json({ error: "Could not fetch related papers." }, { status: 502 });
  }
}
