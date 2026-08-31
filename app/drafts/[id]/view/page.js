import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Draft from "@/models/Draft";
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

export default async function ViewDraftPage({ params }) {
  const user = await getCurrentUserPayload();
  if (!user) redirect("/login");

  await connectDB();
  const draft = await Draft.findOne({ _id: params.id, owner: user.userId }).lean();
  if (!draft) notFound();

  const citations = draft.citations || [];
  const style = draft.citationStyle || "apa";
  const sections = draft.sections || [];
  const allContents = sections.map((s) => s.content || "");
  const numberMap = NUMBERED_STYLES.includes(style) ? buildNumberMap(allContents, citations) : null;
  const refs = orderedReferenceList(citations, style, numberMap);

  const renderedSections = sections.map((s) => {
    const raw = s.content || "";
    if (!raw.trim()) return null;
    const withFigures = resolveFigures(raw, draft.figures || []);
    const withInText = resolveInTextCitations(withFigures, citations, style, numberMap);
    return { key: s.key, label: s.label, html: markdownToHtml(withInText) };
  }).filter(Boolean);

  return (
    <article className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href={`/drafts/${draft._id}`} className="text-sm text-accent underline">
          ← Back to editor
        </Link>
        <span className="text-xs uppercase tracking-wide text-ink/50">
          {STYLE_LABEL[style] || "APA"} style
        </span>
      </div>

      <header className="mb-10 text-center border-b border-ink/10 pb-8">
        <h1 className="font-serif text-4xl font-bold leading-tight">{draft.title}</h1>
        {draft.subtitle && <p className="mt-2 text-lg text-ink/60 font-serif italic">{draft.subtitle}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-ink/50">
          {draft.project && <span className="rounded bg-ink/5 px-2 py-0.5">{draft.project}</span>}
          {(draft.tags || []).map((t) => (
            <span key={t} className="rounded bg-accent/10 text-accent px-2 py-0.5">#{t}</span>
          ))}
          <span>
            Last updated{" "}
            {new Date(draft.updatedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          </span>
        </div>
      </header>

      {renderedSections.length === 0 ? (
        <p className="text-ink/50 text-center italic">
          No sections have been written yet.{" "}
          <Link href={`/drafts/${draft._id}`} className="text-accent underline not-italic">Start writing</Link>.
        </p>
      ) : (
        renderedSections.map((s) => (
          <section key={s.key} className="mb-8">
            <h2 className="font-serif text-2xl font-bold mb-3 pb-1 border-b border-ink/10">{s.label}</h2>
            <div className="prose-note font-serif text-[17px]" dangerouslySetInnerHTML={{ __html: s.html }} />
          </section>
        ))
      )}

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
