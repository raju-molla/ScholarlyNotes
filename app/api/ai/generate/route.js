import { NextResponse } from "next/server";
import { getCurrentUserPayload } from "@/lib/getCurrentUser";

// Groq offers a genuinely free tier (no card required) with an
// OpenAI-compatible chat completions API, so it's the default provider.
// If you'd rather pay for Anthropic later, just set ANTHROPIC_API_KEY —
// it's used automatically when GROQ_API_KEY isn't set.
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const MAX_INPUT_CHARS = 12000; // keep requests reasonably sized/cheap

// Builds a "PROJECT CONTEXT" block from the paper's title, its other
// already-written sections, and its reference list, so the model can write
// with awareness of the whole project and cite real, existing references
// instead of either refusing for lack of context or inventing fake ones.
function buildContextBlock(context) {
  if (!context) return "";
  const parts = [];
  if (context.paperTitle) parts.push(`Paper title: ${context.paperTitle}`);
  if (context.paperSubtitle) parts.push(`Subtitle: ${context.paperSubtitle}`);
  if (context.project) parts.push(`Project: ${context.project}`);

  const otherSections = (context.otherSections || []).filter((s) => s.content && s.content.trim());
  if (otherSections.length > 0) {
    const sectionsText = otherSections
      .slice(0, 6)
      .map((s) => `### ${s.label}\n${s.content.trim().slice(0, 1500)}`)
      .join("\n\n");
    parts.push(`Other sections already written in this paper (for context and consistency — do not repeat their content verbatim):\n${sectionsText}`);
  }

  const citations = context.citations || [];
  if (citations.length > 0) {
    const refsText = citations
      .slice(0, 40)
      .map((c) => `- [@${c.key}] ${c.authors || "Unknown author"} (${c.year || "n.d."}). ${c.title}`)
      .join("\n");
    parts.push(
      `This paper's existing reference list — cite the ones genuinely relevant to what you write, inline, using their [@key] EXACTLY as shown below. Do not force a citation where none of these are relevant, and never invent a reference or key that isn't in this list:\n${refsText}`
    );
  }

  if (parts.length === 0) return "";
  return `PROJECT CONTEXT (use this — don't ask the user to repeat it):\n${parts.join("\n\n")}\n\n---\n\n`;
}

function buildPrompt({ action, text, instructions, targetWords, sectionLabel, context }) {
  const wordsClause = targetWords ? ` Aim for approximately ${targetWords} words.` : "";
  const trimmedText = (text || "").slice(0, MAX_INPUT_CHARS);
  const contextBlock = buildContextBlock(context);
  const hasRefs = (context?.citations || []).length > 0;
  const citeClause = hasRefs
    ? " Where the project's reference list (above) contains something genuinely relevant, cite it inline using its exact [@key]."
    : "";

  switch (action) {
    case "expand":
      return `${contextBlock}You are helping a researcher expand a section ("${sectionLabel}") of their academic paper. Expand the draft below with more depth, detail, and supporting explanation in the same voice, consistent with the project context above.${citeClause} Do not invent citations, data, or sources beyond what's provided.${wordsClause}\n\nCurrent text of this section:\n"""\n${trimmedText}\n"""\n\nReturn only the expanded section text — no preamble, no markdown code fences.`;
    case "fix_grammar":
      return `${contextBlock}Proofread and improve the grammar, clarity, and flow of this academic paper section ("${sectionLabel}"). Preserve the meaning and every factual claim exactly; do not add new content or citations beyond what's already there.${wordsClause}\n\nText:\n"""\n${trimmedText}\n"""\n\nReturn only the corrected text — no preamble, no markdown code fences.`;
    case "generate":
      return `${contextBlock}Write the "${sectionLabel}" section of an academic research paper, in a formal academic tone, consistent with the project context above.${
        instructions ? ` Additional instructions: ${instructions}` : ""
      }${citeClause}${wordsClause} If the project context doesn't give you enough to write a well-grounded section, do your best with what's provided rather than asking the user to repeat it — note any assumptions briefly in-line if truly necessary.\n\nReturn only the section text — no preamble, no markdown code fences.`;
    default:
      return `${contextBlock}${instructions}\n\n${wordsClause}\n\nText:\n"""\n${trimmedText}\n"""`;
  }
}

async function callGroq(prompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "The AI request failed.");
  return (data.choices?.[0]?.message?.content || "").trim();
}

async function callAnthropic(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "The AI request failed.");
  return (data.content || []).map((b) => b.text || "").join("\n").trim();
}

export async function POST(req) {
  const user = await getCurrentUserPayload();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = process.env.GROQ_API_KEY ? "groq" : process.env.ANTHROPIC_API_KEY ? "anthropic" : null;
  if (!provider) {
    return NextResponse.json(
      {
        error:
          "AI features need an API key. Get a free key at https://console.groq.com/keys and set GROQ_API_KEY in your server's environment variables (see the README) — no card required.",
      },
      { status: 501 }
    );
  }

  const body = await req.json();
  const { action, text = "", instructions = "", targetWords, sectionLabel = "section", context } = body;
  if (!["expand", "fix_grammar", "generate"].includes(action)) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }
  if (action !== "generate" && !text.trim()) {
    return NextResponse.json({ error: "There's no text in this section yet to work with." }, { status: 400 });
  }

  const prompt = buildPrompt({ action, text, instructions, targetWords, sectionLabel, context });

  try {
    const result = provider === "groq" ? await callGroq(prompt) : await callAnthropic(prompt);
    return NextResponse.json({ result, provider });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Could not reach the AI service." }, { status: 502 });
  }
}
