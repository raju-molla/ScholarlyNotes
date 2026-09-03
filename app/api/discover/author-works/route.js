import { NextResponse } from "next/server";
import { getAuthorWorks } from "@/lib/openalex";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const authorId = (searchParams.get("authorId") || "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  if (!authorId) return NextResponse.json({ error: "Missing authorId." }, { status: 400 });

  try {
    const { results, count } = await getAuthorWorks(authorId, { page, perPage: 25 });
    return NextResponse.json({ results, count });
  } catch (err) {
    return NextResponse.json({ error: "Could not fetch this author's works." }, { status: 502 });
  }
}
