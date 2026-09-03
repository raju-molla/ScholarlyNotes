import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken, authCookieOptions, AUTH_COOKIE_NAME } from "@/lib/auth";
import { isConfiguredAdmin } from "@/lib/adminEmails";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email first.", needsVerification: true, email: user.email },
        { status: 403 }
      );
    }

    // One-way sync: if this email is on the owner's ADMIN_EMAILS list and
    // isn't already an admin, promote them now. Never auto-demote here —
    // that would undo a manual promotion made from the /admin panel for
    // someone not on the env list. Demotion stays a manual admin action.
    if (isConfiguredAdmin(user.email) && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const res = NextResponse.json({ user: user.toJSON() });
    res.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions());
    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
