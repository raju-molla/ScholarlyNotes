import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ user: null }, { status: 200 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ user: null }, { status: 200 });

  await connectDB();
  const user = await User.findById(payload.userId);
  if (!user) return NextResponse.json({ user: null }, { status: 200 });

  return NextResponse.json({ user: user.toJSON() });
}
