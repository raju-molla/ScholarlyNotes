import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SavedQuery from "@/models/SavedQuery";
import User from "@/models/User";
import { searchWorks } from "@/lib/openalex";
import { sendDigestEmail, isMailConfigured } from "@/lib/mail";

// Meant to be hit by a scheduled job (see vercel.json) rather than a user.
// Protected by CRON_SECRET — Vercel Cron automatically sends
// `Authorization: Bearer $CRON_SECRET` when that env var is set on the
// project, matching the check below. If you're triggering this from a
// different scheduler, send the same header yourself.
function isAuthorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // refuse to run wide open if nothing is configured
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isMailConfigured()) return NextResponse.json({ error: "SMTP not configured." }, { status: 501 });

  await connectDB();
  const queries = await SavedQuery.find({});
  let emailsSent = 0;
  const errors = [];

  for (const saved of queries) {
    try {
      const user = await User.findById(saved.owner);
      if (!user) continue;

      const { results } = await searchWorks(saved.query, { perPage: 25, oaOnly: saved.oaOnly, sort: "publication_date:desc" });
      const seen = new Set(saved.seenIds);
      const fresh = results.filter((w) => w.openalexId && !seen.has(w.openalexId));

      if (fresh.length > 0) {
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
        emailsSent += 1;
      }

      saved.seenIds = [...seen, ...fresh.map((w) => w.openalexId)].slice(-500);
      saved.lastRunAt = new Date();
      await saved.save();
    } catch (err) {
      errors.push({ query: saved.query, error: err.message });
    }
  }

  return NextResponse.json({ processed: queries.length, emailsSent, errors });
}
