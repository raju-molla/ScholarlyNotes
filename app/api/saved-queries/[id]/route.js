import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SavedQuery from "@/models/SavedQuery";
import { getCurrentUserPayload } from "@/lib/getCurrentUser";
import { searchWorks } from "@/lib/openalex";
import { sendDigestEmail, isMailConfigured } from "@/lib/mail";

export async function DELETE(_req, { params }) {
  const user = await getCurrentUserPayload();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const saved = await SavedQuery.findOne({ _id: params.id, owner: user.userId });
  if (!saved) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await saved.deleteOne();
  return NextResponse.json({ ok: true });
}

// Manual "send me a test digest now" trigger from the /digests page — runs
// the same logic as the scheduled cron job, but for one saved query.
export async function POST(_req, { params }) {
  const user = await getCurrentUserPayload();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isMailConfigured()) {
    return NextResponse.json({ error: "Email isn't configured on this server yet (SMTP_HOST is missing)." }, { status: 501 });
  }

  await connectDB();
  const saved = await SavedQuery.findOne({ _id: params.id, owner: user.userId });
  if (!saved) return NextResponse.json({ error: "Not found." }, { status: 404 });

  try {
    const { results } = await searchWorks(saved.query, { perPage: 25, oaOnly: saved.oaOnly, sort: "publication_date:desc" });
    const seen = new Set(saved.seenIds);
    const fresh = results.filter((w) => w.openalexId && !seen.has(w.openalexId));

    if (fresh.length === 0) {
      return NextResponse.json({ sent: false, message: "No new results since last time — nothing to send." });
    }

    await sendDigestEmail(
      user.email,
      user.name,
      fresh.map((w) => ({
        title: w.title,
        url: w.url,
        year: w.year,
        source: w.source,
        authors: w.authors.map((a) => `${a.firstName} ${a.lastName}`.trim()).filter(Boolean).slice(0, 3).join(", ") || "Unknown authors",
      }))
    );

    saved.seenIds = [...seen, ...fresh.map((w) => w.openalexId)].slice(-500);
    saved.lastRunAt = new Date();
    await saved.save();

    return NextResponse.json({ sent: true, count: fresh.length });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Could not send the digest." }, { status: 502 });
  }
}
