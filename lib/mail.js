import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

export function isMailConfigured() {
  return !!process.env.SMTP_HOST;
}

export async function sendOtpEmail(to, code) {
  const t = getTransporter();
  if (!t) {
    throw new Error("Email isn't configured on this server yet (SMTP_HOST is missing). See the README.");
  }
  await t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Your ScholarlyNotes verification code",
    text: `Your verification code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto;">
        <p>Your ScholarlyNotes verification code is:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 16px 0;">${code}</p>
        <p style="color: #666; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
