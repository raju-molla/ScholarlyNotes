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

export async function PUT(req, { params }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const body = await req.json();
  if (!["user", "admin"].includes(body.role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const target = await User.findById(params.id);
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

  if (target._id.toString() === admin.userId && body.role !== "admin") {
    return NextResponse.json({ error: "You can't remove your own admin access." }, { status: 400 });
  }

  target.role = body.role;
  await target.save();

  return NextResponse.json({ user: target.toJSON() });
}

export async function DELETE(_req, { params }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (params.id === admin.userId) {
    return NextResponse.json({ error: "You can't delete your own account from here." }, { status: 400 });
  }

  await connectDB();
  const target = await User.findById(params.id);
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

  await Promise.all([
    Note.deleteMany({ owner: target._id }),
    Paper.deleteMany({ owner: target._id }),
    Draft.deleteMany({ owner: target._id }),
  ]);
  await target.deleteOne();

  return NextResponse.json({ ok: true });
}
