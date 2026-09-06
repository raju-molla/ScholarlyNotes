"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import OtpVerifyForm from "@/components/OtpVerifyForm";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  if (!email) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="font-serif text-2xl font-bold mb-4">
          Verify your email
        </h1>

        <p className="text-sm text-ink/60">
          We need an email address to verify. Please sign up or log in again to
          get a fresh link.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="font-serif text-2xl font-bold mb-6">
        Verify your email
      </h1>

      <OtpVerifyForm
        email={email}
        // Hard navigation, same reasoning as the login page: avoids a
        // stale Router Cache entry serving the old (unauthenticated)
        // redirect for /notes right after the auth cookie is set.
        onVerified={() => { window.location.href = "/notes"; }}
      />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}