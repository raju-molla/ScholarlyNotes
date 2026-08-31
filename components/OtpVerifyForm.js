"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthProvider";

export default function OtpVerifyForm({ email, onVerified }) {
  const { refresh } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed.");
      await refresh();
      onVerified?.(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError("");
    setResendMessage("");
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not resend code.");
      setResendMessage(data.message || "A new code has been sent.");
      setCooldown(30);
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-ink/70">
        We sent a 6-digit code to <span className="font-medium">{email}</span>. Enter it below to verify your
        account.
      </p>
      <input
        ref={inputRef}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        placeholder="000000"
        className="w-full text-center text-2xl tracking-[0.5em] rounded-md border border-ink/20 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-accent/40"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {resendMessage && !error && <p className="text-sm text-accent">{resendMessage}</p>}

      <button
        type="submit"
        disabled={submitting || code.length !== 6}
        className="w-full rounded-md bg-accent text-white py-2.5 font-medium hover:bg-accent/90 disabled:opacity-60"
      >
        {submitting ? "Verifying…" : "Verify"}
      </button>

      <button
        type="button"
        onClick={resend}
        disabled={resending || cooldown > 0}
        className="w-full text-sm text-center text-accent underline disabled:no-underline disabled:text-ink/40"
      >
        {cooldown > 0 ? `Resend code in ${cooldown}s` : resending ? "Sending…" : "Resend code"}
      </button>
    </form>
  );
}
