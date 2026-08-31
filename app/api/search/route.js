import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Note from "@/models/Note";
import Paper from "@/models/Paper";
import Draft from "@/models/Draft";
import { getCurrentUserPayload } from "@/lib/getCurrentUser";

export async function GET(req) {
  const user = await getCurrentUserPayload();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ notes: [], papers: [], drafts: [] });

  await connectDB();
  const rx = { $regex: q, $options: "i" };
  const owner = user.userId;

  const [notes, papers, drafts] = await Promise.all([
    Note.find({ owner, $or: [{ title: rx }, { content: rx }, { tags: rx }, { project: rx }] })
      .select("title tags project updatedAt")
      .sort({ updatedAt: -1 })
      .limit(15),
    Paper.find({ owner, $or: [{ title: rx }, { tags: rx }, { source: rx }, { myNotes: rx }, { key: rx }] })
      .select("title tags source year status updatedAt")
      .sort({ updatedAt: -1 })
      .limit(15),
    Draft.find({ owner, $or: [{ title: rx }, { subtitle: rx }, { tags: rx }, { project: rx }] })
      .select("title subtitle tags project updatedAt")
      .sort({ updatedAt: -1 })
      .limit(15),
  ]);

  return NextResponse.json({ notes, papers, drafts });
}
