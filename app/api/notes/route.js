import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Note from "@/models/Note";
import { getCurrentUserPayload } from "@/lib/getCurrentUser";

export async function GET(req) {
  const user = await getCurrentUserPayload();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const filter = { owner: user.userId };
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { tags: { $regex: q, $options: "i" } },
      { project: { $regex: q, $options: "i" } },
    ];
  }

  const notes = await Note.find(filter).sort({ updatedAt: -1 }).select(
    "title tags project updatedAt createdAt citationStyle citations"
  );

  return NextResponse.json({ notes });
}

export async function POST(req) {
  const user = await getCurrentUserPayload();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();

  const note = await Note.create({
    owner: user.userId,
    title: body.title || "Untitled note",
    tags: body.tags || [],
    project: body.project || "",
    content: body.content || "",
    citationStyle: body.citationStyle || "apa",
    citations: body.citations || [],
    figures: body.figures || [],
  });

  return NextResponse.json({ note }, { status: 201 });
}
