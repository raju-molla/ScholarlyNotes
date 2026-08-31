import Link from "next/link";
import { getCurrentUserPayload } from "@/lib/getCurrentUser";

export default async function Home() {
  const user = await getCurrentUserPayload();

  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight">
        Your complete research center.
      </h1>
      <p className="mt-4 text-lg text-ink/70">
        Build a personal library of every paper you read, take notes with
        proper citations attached, and write full research papers section by
        section — Abstract through Conclusion, with an Implementation section
        built in — all backed by a clean, organized reference list, image
        support, and AI writing assistance.
      </p>

      {user ? (
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/library"
            className="rounded-md bg-accent text-white px-6 py-3 font-medium hover:bg-accent/90"
          >
            Go to your library
          </Link>
          <Link
            href="/drafts"
            className="rounded-md border border-ink/20 px-6 py-3 font-medium hover:bg-ink/5"
          >
            Your drafts
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-md bg-accent text-white px-6 py-3 font-medium hover:bg-accent/90"
          >
            Create free account
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-ink/20 px-6 py-3 font-medium hover:bg-ink/5"
          >
            Log in
          </Link>
        </div>
      )}

      <div className="mt-16 grid sm:grid-cols-3 gap-6 text-left">
        <div className="rounded-lg border border-ink/10 p-5">
          <h3 className="font-serif font-semibold text-lg mb-2">Build your library</h3>
          <p className="text-sm text-ink/70">
            Log every paper you read with its metadata, abstract, and your own reading notes and quotes.
          </p>
        </div>
        <div className="rounded-lg border border-ink/10 p-5">
          <h3 className="font-serif font-semibold text-lg mb-2">Cite in one click</h3>
          <p className="text-sm text-ink/70">
            Pull citations straight from your library into any note or draft — no retyping references.
          </p>
        </div>
        <div className="rounded-lg border border-ink/10 p-5">
          <h3 className="font-serif font-semibold text-lg mb-2">Write with AI help</h3>
          <p className="text-sm text-ink/70">
            Expand a section, fix grammar, or generate a first draft from a prompt — to a word count you choose.
          </p>
        </div>
      </div>
    </div>
  );
}
