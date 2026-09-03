import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 mt-20 print:hidden">
      <div className="max-w-5xl mx-auto px-4 py-12 grid gap-10 sm:grid-cols-3">
        <div>
          <Link href="/" className="font-serif text-lg font-bold tracking-tight">
            Scholarly<span className="text-accent">Notes</span>
          </Link>
          <p className="mt-2 text-sm text-ink/60 max-w-xs">
            A research workspace for finding papers, building a library, and writing fully cited drafts —
            end to end, in one place.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink/40">Product</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/discover" className="text-ink/70 hover:text-accent">Discover papers</Link></li>
            <li><Link href="/library" className="text-ink/70 hover:text-accent">Library</Link></li>
            <li><Link href="/drafts" className="text-ink/70 hover:text-accent">Drafts</Link></li>
            <li><Link href="/digests" className="text-ink/70 hover:text-accent">Digests</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink/40">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href="mailto:rajumolla@scholarlynotes.com" className="text-ink/70 hover:text-accent">
                rajumolla@scholarlynotes.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-ink/40">
          <span>© {new Date().getFullYear()} ScholarlyNotes. Built for researchers.</span>
          <span>Paper metadata via OpenAlex.</span>
        </div>
      </div>
    </footer>
  );
}
