import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Note from "@/models/Note";
import { getCurrentUserPayload } from "@/lib/getCurrentUser";
import {
  markdownToHtml,
  resolveInTextCitations,
  resolveFigures,
  formatCitation,
  buildNumberMap,
  orderedReferenceList,
  NUMBERED_STYLES,
} from "@/utils/citationFormatter";
import PrintButton from "@/components/PrintButton";
import CopyBibliographyButton from "@/components/CopyBibliographyButton";

const STYLE_LABEL = { apa: "APA", mla: "MLA", chicago: "Chicago", harvard: "Harvard", ieee: "IEEE", vancouver: "Vancouver" };

export default async function ViewNotePage({ params }) {
  const user = await getCurrentUserPayload();
  if (!user) redirect("/login");

  await connectDB();
  const note = await Note.findOne({ _id: params.id, owner: user.userId }).lean();
  if (!note) notFound();

  const citations = note.citations || [];
  const style = note.citationStyle || "apa";
  const numberMap = NUMBERED_STYLES.includes(style) ? buildNumberMap([note.content], citations) : null;

  const withInText = resolveInTextCitations(resolveFigures(note.content || "", note.figures || []), citations, style, numberMap);
  const html = markdownToHtml(withInText);
  const refs = orderedReferenceList(citations, style, numberMap);

  return (
    <article className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href={`/notes/${note._id}`} className="text-sm text-accent underline">
          ← Back to editor
        </Link>
        <span className="text-xs uppercase tracking-wide text-ink/50">
          {STYLE_LABEL[style] || "APA"} style
        </span>
      </div>

      <header className="mb-8 border-b border-ink/10 pb-6">
        <h1 className="font-serif text-4xl font-bold leading-tight">{note.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink/50">
          {note.project && <span className="rounded bg-ink/5 px-2 py-0.5">{note.project}</span>}
          {(note.tags || []).map((t) => (
            <span key={t} className="rounded bg-accent/10 text-accent px-2 py-0.5">#{t}</span>
          ))}
          <span>Last updated {new Date(note.updatedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>
        </div>
      </header>

      <div className="prose-note font-serif text-[17px]" dangerouslySetInnerHTML={{ __html: html }} />

      {refs.length > 0 && (
        <section className="mt-12 pt-6 border-t border-ink/10">
          <div className="flex items-center justify-between mb-4 print:hidden">
            <h2 className="font-serif text-2xl font-bold">References</h2>
            <CopyBibliographyButton citations={refs} />
          </div>
          <h2 className="font-serif text-2xl font-bold mb-4 hidden print:block">References</h2>
          <ol className="space-y-3">
            {refs.map((c) => (
              <li
                key={c.key}
                id={`ref-${c.key}`}
                className="text-[15px] leading-relaxed pl-8 -indent-8 scroll-mt-20"
                dangerouslySetInnerHTML={{
                  __html: formatCitation(c, style, numberMap ? numberMap[c.key] : null).replace(/\*(.+?)\*/g, "<em>$1</em>"),
                }}
              />
            ))}
          </ol>
        </section>
      )}

      <div className="mt-10 text-center print:hidden">
        <PrintButton />
      </div>
    </article>
  );
}
