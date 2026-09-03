import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Paper from "@/models/Paper";
import { getCurrentUserPayload } from "@/lib/getCurrentUser";

async function loadOwnedPaper(id, userId) {
  return Paper.findOne({ _id: id, owner: userId });
}

export async function GET(_req, { params }) {
  const user = await getCurrentUserPayload();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const paper = await loadOwnedPaper(params.id, user.userId);
  if (!paper) return NextResponse.json({ error: "Paper not found." }, { status: 404 });

  return NextResponse.json({ paper });
}

export async function PUT(req, { params }) {
  const user = await getCurrentUserPayload();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const paper = await loadOwnedPaper(params.id, user.userId);
  if (!paper) return NextResponse.json({ error: "Paper not found." }, { status: 404 });

  const body = await req.json();
  const fields = [
    "type", "authors", "title", "source", "year", "volume", "issue", "pages",
    "publisher", "doi", "url", "fileUrl", "abstract", "summary", "openalexId",
    "tags", "status", "myNotes",
  ];
  for (const f of fields) {
    if (body[f] !== undefined) paper[f] = body[f];
  }
  if (body.key && body.key !== paper.key) {
    const clash = await Paper.findOne({ owner: user.userId, key: body.key, _id: { $ne: paper._id } });
    if (clash) {
      return NextResponse.json({ error: "That citation key is already used by another paper." }, { status: 409 });
    }
    paper.key = body.key;
  }
  await paper.save();

  return NextResponse.json({ paper });
}

export async function DELETE(_req, { params }) {
  const user = await getCurrentUserPayload();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const paper = await loadOwnedPaper(params.id, user.userId);
  if (!paper) return NextResponse.json({ error: "Paper not found." }, { status: 404 });

  await paper.deleteOne();
  return NextResponse.json({ ok: true });
}
