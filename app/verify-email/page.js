"use client";

import { useRouter, useSearchParams } from "next/navigation";
import OtpVerifyForm from "@/components/OtpVerifyForm";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  if (!email) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="font-serif text-2xl font-bold mb-4">Verify your email</h1>
        <p className="text-sm text-ink/60">
          We need an email address to verify. Please sign up or log in again to get a fresh link.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="font-serif text-2xl font-bold mb-6">Verify your email</h1>
      <OtpVerifyForm email={email} onVerified={() => router.push("/notes")} />
    </div>
  );
}
