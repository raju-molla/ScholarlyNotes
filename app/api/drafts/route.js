import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Draft from "@/models/Draft";
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

  const drafts = await Draft.find(filter)
    .sort({ updatedAt: -1 })
    .select("title subtitle project tags updatedAt createdAt citations");

  return NextResponse.json({ drafts });
}

export async function POST(req) {
  const user = await getCurrentUserPayload();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();

  const draft = await Draft.create({
    owner: user.userId,
    title: body.title || "Untitled paper",
    subtitle: body.subtitle || "",
    project: body.project || "",
    tags: body.tags || [],
    citationStyle: body.citationStyle || "apa",
    citations: body.citations || [],
    sections: body.sections || [],
    targets: body.targets || {},
    figures: body.figures || [],
  });

  return NextResponse.json({ draft }, { status: 201 });
}
