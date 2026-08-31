import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken, authCookieOptions, AUTH_COOKIE_NAME } from "@/lib/auth";
import { compareOtp, OTP_MAX_ATTEMPTS } from "@/lib/otp";

export async function POST(req) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: "No pending signup found for that email." }, { status: 404 });
    }

    // Idempotent: if they already verified (e.g. double-submitted), just log them in.
    if (!user.emailVerified) {
      if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
        return NextResponse.json(
          { error: "Too many incorrect attempts. Request a new code." },
          { status: 429 }
        );
      }
      if (!user.otpExpiresAt || user.otpExpiresAt.getTime() < Date.now()) {
        return NextResponse.json({ error: "That code has expired. Request a new one." }, { status: 400 });
      }

      const valid = await compareOtp(String(code).trim(), user.otpCodeHash);
      if (!valid) {
        user.otpAttempts += 1;
        await user.save();
        return NextResponse.json({ error: "That code isn't right. Please try again." }, { status: 400 });
      }

      user.emailVerified = true;
      user.otpCodeHash = null;
      user.otpExpiresAt = null;
      user.otpAttempts = 0;
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
    console.error("Verify OTP error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
