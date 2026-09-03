"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OtpVerifyForm from "@/components/OtpVerifyForm";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState("form"); // "form" | "verify"
  const [pendingEmail, setPendingEmail] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    institution: "",
    field: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed.");
      setPendingEmail(data.email || form.email);
      setStep("verify");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "verify") {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="font-serif text-2xl font-bold mb-6">Verify your email</h1>
        <OtpVerifyForm email={pendingEmail} onVerified={() => router.push("/notes")} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="font-serif text-2xl font-bold mb-6">Create your account</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name" value={form.name} onChange={update("name")} required />
        <Field label="Email" type="email" value={form.email} onChange={update("email")} required />
        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={update("password")}
          required
          hint="At least 8 characters."
        />
        <Field label="Institution (optional)" value={form.institution} onChange={update("institution")} />
        <Field label="Field of research (optional)" value={form.field} onChange={update("field")} />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-accent text-white py-2.5 font-medium hover:bg-accent/90 disabled:opacity-60"
        >
          {submitting ? "Sending code…" : "Sign up"}
        </button>
      </form>
      <p className="mt-4 text-sm text-ink/70">
        Already have an account?{" "}
        <Link href="/login" className="text-accent underline">Log in</Link>
      </p>
    </div>
  );
}

function Field({ label, hint, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink/80">{label}</span>
      <input
        {...props}
        className="mt-1 w-full rounded-md border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
      {hint && <span className="text-xs text-ink/50">{hint}</span>}
    </label>
  );
}
