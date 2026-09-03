import { NextResponse } from "next/server";
import { searchAuthors } from "@/lib/openalex";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ results: [] });

  try {
    const results = await searchAuthors(q);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: "Could not search authors." }, { status: 502 });
  }
}
