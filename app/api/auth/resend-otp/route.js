import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { generateOtpCode, hashOtp, otpExpiry, OTP_RESEND_COOLDOWN_MS } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mail";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Don't reveal whether the account exists — respond the same way either way.
    if (!user || user.emailVerified) {
      return NextResponse.json({ ok: true, message: "If that account needs verification, a new code has been sent." });
    }

    if (user.otpLastSentAt && Date.now() - user.otpLastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((OTP_RESEND_COOLDOWN_MS - (Date.now() - user.otpLastSentAt.getTime())) / 1000);
      return NextResponse.json({ error: `Please wait ${waitSec}s before requesting another code.` }, { status: 429 });
    }

    const code = generateOtpCode();
    user.otpCodeHash = await hashOtp(code);
    user.otpExpiresAt = otpExpiry();
    user.otpAttempts = 0;
    user.otpLastSentAt = new Date();
    await user.save();

    await sendOtpEmail(user.email, code);

    return NextResponse.json({ ok: true, message: "A new code has been sent." });
  } catch (err) {
    console.error("Resend OTP error:", err);
    return NextResponse.json({ error: "Could not send a new code. Please try again shortly." }, { status: 500 });
  }
}
