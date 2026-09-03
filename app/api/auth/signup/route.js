import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { isConfiguredAdmin } from "@/lib/adminEmails";
import { generateOtpCode, hashOtp, otpExpiry } from "@/lib/otp";
import { sendOtpEmail, isMailConfigured } from "@/lib/mail";

export async function POST(req) {
  try {
    const { name, email, password, institution, field } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }
    if (!isMailConfigured()) {
      return NextResponse.json(
        { error: "Email verification isn't configured on this server yet. See the README (SMTP_HOST etc.)." },
        { status: 501 }
      );
    }

    await connectDB();

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });

    if (existing && existing.emailVerified) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await User.hashPassword(password);
    const role = isConfiguredAdmin(cleanEmail) ? "admin" : "user";
    const code = generateOtpCode();
    const otpCodeHash = await hashOtp(code);

    let user;
    if (existing) {
      // Unverified account re-attempting signup — refresh their details and
      // issue a new code rather than blocking them with a duplicate error.
      existing.name = name.trim();
      existing.passwordHash = passwordHash;
      existing.institution = institution || "";
      existing.field = field || "";
      existing.role = role;
      existing.otpCodeHash = otpCodeHash;
      existing.otpExpiresAt = otpExpiry();
      existing.otpAttempts = 0;
      existing.otpLastSentAt = new Date();
      user = await existing.save();
    } else {
      user = await User.create({
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        institution: institution || "",
        field: field || "",
        role,
        emailVerified: false,
        otpCodeHash,
        otpExpiresAt: otpExpiry(),
        otpAttempts: 0,
        otpLastSentAt: new Date(),
      });
    }

    try {
      await sendOtpEmail(user.email, code);
    } catch (mailErr) {
      console.error("OTP send error:", mailErr);
      return NextResponse.json(
        { error: "Could not send the verification email. Double-check your SMTP settings and try again." },
        { status: 502 }
      );
    }

    // No auth cookie yet — the account isn't usable until the code is verified.
    return NextResponse.json({ pendingVerification: true, email: user.email }, { status: 200 });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
