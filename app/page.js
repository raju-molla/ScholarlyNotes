import Link from "next/link";
import { getCurrentUserPayload } from "@/lib/getCurrentUser";

const STEPS = [
  {
    n: "01",
    title: "Find it",
    body: "Search the open scholarly record — 250M+ papers across every field — right from Discover. No account needed to look.",
  },
  {
    n: "02",
    title: "Keep it",
    body: "One click adds a paper to your library with its metadata, abstract, and an AI-generated plain-language summary already attached.",
  },
  {
    n: "03",
    title: "Write with it",
    body: "Pull any saved paper into a note or a full draft as a proper citation — never retype a reference again.",
  },
  {
    n: "04",
    title: "Stay current",
    body: "Save a search you care about and get a digest the moment something new is published.",
  },
];

const FEATURES = [
  {
    n: "01",
    title: "Discover",
    body: "Search by title, topic, or author across the open literature, with citation counts and open-access links.",
  },
  {
    n: "02",
    title: "A real library",
    body: "Every paper you save keeps its full metadata, your notes, and an auto-generated summary — organized and searchable.",
  },
  {
    n: "03",
    title: "Related papers",
    body: "See what's connected to anything you've saved, sourced from the citation graph, and add it in one click.",
  },
  {
    n: "04",
    title: "Cite in one click",
    body: "Pull citations straight from your library into any note or draft — APA, MLA, or Chicago, your choice.",
  },
  {
    n: "05",
    title: "Write with AI help",
    body: "Expand a section, fix grammar, or draft from a prompt, to a word count you choose — section by section.",
  },
  {
    n: "06",
    title: "Deadlines & digests",
    body: "Track a submission deadline against your draft's progress, and get emailed when a saved search turns up something new.",
  },
];

export default async function Home() {
  const user = await getCurrentUserPayload();

  return (
    <div>
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pt-20 pb-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent2">
          An open research workspace
        </p>
        <h1 className="mt-4 font-serif text-4xl md:text-5xl font-bold leading-tight">
          Read widely. <em className="italic text-accent">Write clearly.</em> Cite effortlessly.
        </h1>
        <p className="mt-5 text-lg text-ink/70 max-w-2xl mx-auto">
          Search the open scholarly record, build a personal library as you read, and write full papers
          section by section — with your references, notes, and an AI assist always within reach.
        </p>

        {user ? (
          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            <Link href="/library" className="rounded-md bg-accent text-white px-6 py-3 font-medium hover:bg-accent/90">
              Go to your library
            </Link>
            <Link href="/discover" className="rounded-md border border-ink/20 px-6 py-3 font-medium hover:bg-ink/5">
              Discover papers
            </Link>
          </div>
        ) : (
          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            <Link href="/signup" className="rounded-md bg-accent text-white px-6 py-3 font-medium hover:bg-accent/90">
              Create free account
            </Link>
            <Link href="/login" className="rounded-md border border-ink/20 px-6 py-3 font-medium hover:bg-ink/5">
              Log in
            </Link>
          </div>
        )}

        <p className="mt-6 text-xs text-ink/40">
          Free to start · No credit card · Your library stays yours
        </p>
      </section>

      {/* How it works */}
      <section className="border-y border-ink/10 bg-ink/[0.02]">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="font-serif text-2xl font-bold text-center mb-12">How it fits together</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative">
                <span className="font-serif text-4xl text-accent/25 font-bold">{s.n}</span>
                <h3 className="font-serif font-semibold text-lg mt-2">{s.title}</h3>
                <p className="text-sm text-ink/60 mt-1.5 leading-relaxed">{s.body}</p>
                {i < STEPS.length - 1 && (
                  <span className="hidden lg:block absolute top-4 -right-4 text-ink/20">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="font-serif text-2xl font-bold text-center mb-2">Everything a working researcher needs</h2>
        <p className="text-center text-ink/60 mb-12 max-w-xl mx-auto">
          Not a dozen disconnected tools — one workspace that carries a paper from first search to final draft.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.n} className="rounded-lg border border-ink/10 p-5 hover:border-accent/30 transition-colors">
              <span className="text-xs font-semibold text-accent2 tracking-wide">{f.n}</span>
              <h3 className="font-serif font-semibold text-lg mt-1 mb-2">{f.title}</h3>
              <p className="text-sm text-ink/70 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA band */}
      <section className="bg-ink text-paper">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold">
            Start building your library today.
          </h2>
          <p className="mt-3 text-paper/70">
            {user
              ? "Pick up right where you left off."
              : "Free to start — bring your first paper and see how it feels."}
          </p>
          <div className="mt-7">
            <Link
              href={user ? "/discover" : "/signup"}
              className="inline-block rounded-md bg-accent px-6 py-3 font-medium hover:bg-accent/90"
            >
              {user ? "Search for a paper" : "Create free account"}
            </Link>
          </div>
          <p className="mt-6 text-xs text-paper/40">
            Questions or feedback? <a href="mailto:rajumolla@scholarlynotes.com" className="underline hover:text-paper/70">rajumolla@scholarlynotes.com</a>
          </p>
        </div>
      </section>
    </div>
  );
}
