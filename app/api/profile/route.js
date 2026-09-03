import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getCurrentUserPayload } from "@/lib/getCurrentUser";

export async function GET() {
  const payload = await getCurrentUserPayload();
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(payload.userId);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ user: user.toJSON() });
}

export async function PUT(req) {
  const payload = await getCurrentUserPayload();
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(payload.userId);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  if (body.name !== undefined) user.name = body.name.trim() || user.name;
  if (body.institution !== undefined) user.institution = body.institution;
  if (body.field !== undefined) user.field = body.field;
  await user.save();

  return NextResponse.json({ user: user.toJSON() });
}
