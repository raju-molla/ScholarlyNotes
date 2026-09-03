import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Paper from "@/models/Paper";
import { getCurrentUserPayload } from "@/lib/getCurrentUser";

function slugKey(paper) {
  const last = paper.authors?.[0]?.lastName?.replace(/[^a-zA-Z0-9]/g, "") || "paper";
  const year = paper.year?.replace(/[^0-9]/g, "") || "";
  return `${last.toLowerCase()}${year}`;
}

function normalizeTitle(t) {
  return (t || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// Adds several papers in one request (used by the "bulk-import an
// author's works" flow) — skips anything that looks like a duplicate
// rather than failing the whole batch, and reports per-item outcomes.
export async function POST(req) {
  const user = await getCurrentUserPayload();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) return NextResponse.json({ error: "No items to add." }, { status: 400 });

  const existing = await Paper.find({ owner: user.userId }).select("title doi key");
  const existingNormTitles = new Set(existing.map((p) => normalizeTitle(p.title)));
  const existingDois = new Set(existing.map((p) => p.doi).filter(Boolean));
  const usedKeys = new Set(existing.map((p) => p.key));

  const results = [];
  for (const item of items.slice(0, 100)) {
    if (!item.title) {
      results.push({ title: item.title || "(untitled)", status: "error", message: "Missing title." });
      continue;
    }
    const normTitle = normalizeTitle(item.title);
    if ((item.doi && existingDois.has(item.doi)) || existingNormTitles.has(normTitle)) {
      results.push({ title: item.title, status: "duplicate" });
      continue;
    }

    let key = slugKey(item);
    let candidate = key;
    let suffix = 1;
    while (usedKeys.has(candidate)) {
      suffix += 1;
      candidate = `${key}${suffix}`;
    }
    usedKeys.add(candidate);

    const paper = await Paper.create({
      owner: user.userId,
      key: candidate,
      type: item.type || "article",
      authors: item.authors || [],
      title: item.title,
      source: item.source || "",
      year: item.year || "",
      doi: item.doi || "",
      url: item.url || "",
      fileUrl: item.fileUrl || "",
      abstract: item.abstract || "",
      openalexId: item.openalexId || "",
      status: "to-read",
    });

    existingNormTitles.add(normTitle);
    if (item.doi) existingDois.add(item.doi);
    results.push({ title: item.title, status: "added", id: paper._id });
  }

  return NextResponse.json({ results });
}
