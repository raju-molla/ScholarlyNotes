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

export async function GET(req) {
  const user = await getCurrentUserPayload();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const status = searchParams.get("status");
  const project = searchParams.get("project");

  const filter = { owner: user.userId };
  if (status) filter.status = status;
  if (project) filter.tags = project; // tags double as light project grouping via search
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { tags: { $regex: q, $options: "i" } },
      { source: { $regex: q, $options: "i" } },
      { key: { $regex: q, $options: "i" } },
    ];
  }

  const papers = await Paper.find(filter).sort({ createdAt: -1 });
  return NextResponse.json({ papers });
}

export async function POST(req) {
  const user = await getCurrentUserPayload();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();

  if (!body.title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  // Duplicate detection: same DOI, or a near-identical normalized title.
  // Skipped when the caller passes force: true (user confirmed it's not a dupe).
  if (!body.force) {
    const candidates = await Paper.find({ owner: user.userId }).select("title doi key");
    const normNew = normalizeTitle(body.title);
    const dupe = candidates.find(
      (p) => (body.doi && p.doi && p.doi === body.doi) || normalizeTitle(p.title) === normNew
    );
    if (dupe) {
      return NextResponse.json(
        {
          error: "duplicate",
          message: `This looks like a duplicate of "${dupe.title}" already in your library.`,
          existing: { id: dupe._id, title: dupe.title, key: dupe.key },
        },
        { status: 409 }
      );
    }
  }

  let key = (body.key || slugKey(body)).trim().replace(/\s+/g, "");
  let candidate = key;
  let suffix = 1;
  while (await Paper.findOne({ owner: user.userId, key: candidate })) {
    suffix += 1;
    candidate = `${key}${suffix}`;
  }

  const paper = await Paper.create({
    owner: user.userId,
    key: candidate,
    type: body.type || "article",
    authors: body.authors || [],
    title: body.title,
    source: body.source || "",
    year: body.year || "",
    volume: body.volume || "",
    issue: body.issue || "",
    pages: body.pages || "",
    publisher: body.publisher || "",
    doi: body.doi || "",
    url: body.url || "",
    fileUrl: body.fileUrl || "",
    abstract: body.abstract || "",
    tags: body.tags || [],
    status: body.status || "to-read",
    myNotes: body.myNotes || "",
  });

  return NextResponse.json({ paper }, { status: 201 });
}
