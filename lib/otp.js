import bcrypt from "bcryptjs";

export function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // always 6 digits
}

export function hashOtp(code) {
  return bcrypt.hash(code, 10);
}

export function compareOtp(code, hash) {
  if (!hash) return Promise.resolve(false);
  return bcrypt.compare(code, hash);
}

export function otpExpiry(minutes = 10) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
