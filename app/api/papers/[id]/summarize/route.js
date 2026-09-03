import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Paper from "@/models/Paper";
import { getCurrentUserPayload } from "@/lib/getCurrentUser";
import { getAIProvider, generateWithAI } from "@/lib/ai";

export async function POST(_req, { params }) {
  const user = await getCurrentUserPayload();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!getAIProvider()) {
    return NextResponse.json(
      { error: "AI features need GROQ_API_KEY (free, no card) or ANTHROPIC_API_KEY set in your server's environment." },
      { status: 501 }
    );
  }

  await connectDB();
  const paper = await Paper.findOne({ _id: params.id, owner: user.userId });
  if (!paper) return NextResponse.json({ error: "Paper not found." }, { status: 404 });
  if (!paper.abstract?.trim()) {
    return NextResponse.json({ error: "This paper has no abstract to summarize yet." }, { status: 400 });
  }

  try {
    const prompt = `Summarize this academic abstract in 2-3 plain-language sentences a non-specialist could follow. No preamble, no markdown — just the summary.\n\nAbstract:\n"""\n${paper.abstract.slice(0, 4000)}\n"""`;
    const { result } = await generateWithAI(prompt);
    paper.summary = result;
    await paper.save();
    return NextResponse.json({ summary: result });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Could not reach the AI service." }, { status: 502 });
  }
}
