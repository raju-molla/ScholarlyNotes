import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SavedQuery from "@/models/SavedQuery";
import { getCurrentUserPayload } from "@/lib/getCurrentUser";

export async function GET() {
  const user = await getCurrentUserPayload();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const queries = await SavedQuery.find({ owner: user.userId }).sort({ createdAt: -1 });
  return NextResponse.json({ queries });
}

export async function POST(req) {
  const user = await getCurrentUserPayload();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const query = (body.query || "").trim();
  if (!query) return NextResponse.json({ error: "A search term is required." }, { status: 400 });

  try {
    const saved = await SavedQuery.create({
      owner: user.userId,
      query,
      oaOnly: !!body.oaOnly,
    });
    return NextResponse.json({ query: saved }, { status: 201 });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ error: "You're already following this search." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not save this search." }, { status: 500 });
  }
}
