import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Note from "@/models/Note";
import Paper from "@/models/Paper";
import Draft from "@/models/Draft";
import { getCurrentUserPayload } from "@/lib/getCurrentUser";

async function requireAdmin() {
  const payload = await getCurrentUserPayload();
  if (!payload || payload.role !== "admin") return null;
  return payload;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const users = await User.find().sort({ createdAt: -1 });

  const counts = await Promise.all(
    users.map(async (u) => {
      const [papers, notes, drafts] = await Promise.all([
        Paper.countDocuments({ owner: u._id }),
        Note.countDocuments({ owner: u._id }),
        Draft.countDocuments({ owner: u._id }),
      ]);
      return { ...u.toJSON(), counts: { papers, notes, drafts } };
    })
  );

  const totals = {
    users: users.length,
    papers: await Paper.countDocuments(),
    notes: await Note.countDocuments(),
    drafts: await Draft.countDocuments(),
  };

  return NextResponse.json({ users: counts, totals });
}
