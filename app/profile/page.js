"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function ProfilePage() {
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [field, setField] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({ papers: [], notes: [], drafts: [] });

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((d) => {
      if (d.user) {
        setEmail(d.user.email || "");
        setName(d.user.name || "");
        setInstitution(d.user.institution || "");
        setField(d.user.field || "");
      }
      setLoading(false);
    });
    Promise.all([
      fetch("/api/papers").then((r) => r.json()),
      fetch("/api/notes").then((r) => r.json()),
      fetch("/api/drafts").then((r) => r.json()),
    ]).then(([papers, notes, drafts]) => {
      setStats({ papers: papers.papers || [], notes: notes.notes || [], drafts: drafts.drafts || [] });
    });
  }, []);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, institution, field }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save profile.");
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const readCount = stats.papers.filter((p) => p.status === "read").length;
  const toReadCount = stats.papers.filter((p) => p.status === "to-read").length;
  const readingCount = stats.papers.filter((p) => p.status === "reading").length;

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-10 text-ink/60">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-serif text-2xl font-bold mb-6">Your profile</h1>

      <div className="rounded-lg border border-ink/10 p-5 mb-8">
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-ink/80">Full name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border border-ink/20 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink/80">Email</span>
            <input value={email} disabled className="mt-1 w-full rounded-md border border-ink/20 px-3 py-2 text-sm bg-ink/5 text-ink/50" />
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-ink/80">Institution</span>
              <input value={institution} onChange={(e) => setInstitution(e.target.value)} className="mt-1 w-full rounded-md border border-ink/20 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink/80">Field of research</span>
              <input value={field} onChange={(e) => setField(e.target.value)} className="mt-1 w-full rounded-md border border-ink/20 px-3 py-2 text-sm" />
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={save}
            disabled={saving}
            className="rounded-md bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 disabled:opacity-60"
          >
            {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
          </button>
        </div>
      </div>

      <h2 className="font-serif text-xl font-bold mb-4">Everything at a glance</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        <OverviewCard href="/library" title="Library" big={stats.papers.length} lines={[
          `${toReadCount} to read`, `${readingCount} reading`, `${readCount} read`,
        ]} />
        <OverviewCard href="/notes" title="Notes" big={stats.notes.length} lines={[
          `${stats.notes.length} quick note${stats.notes.length === 1 ? "" : "s"}`,
        ]} />
        <OverviewCard href="/drafts" title="Paper drafts" big={stats.drafts.length} lines={[
          `${stats.drafts.length} in progress`,
        ]} />
      </div>
    </div>
  );
}

function OverviewCard({ href, title, big, lines }) {
  return (
    <Link href={href} className="rounded-lg border border-ink/10 p-4 hover:border-accent/40 block">
      <div className="text-3xl font-serif font-bold">{big}</div>
      <div className="text-sm font-medium mt-1">{title}</div>
      <div className="text-xs text-ink/50 mt-2 space-y-0.5">
        {lines.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </Link>
  );
}
