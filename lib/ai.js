// Shared provider logic for calling an LLM — used by the writing-assist
// route (app/api/ai/generate) and by auto-summarize on paper import.
// Groq is free/keyless-to-sign-up and is the default; ANTHROPIC_API_KEY is
// used automatically as a paid fallback if GROQ_API_KEY isn't set.

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

export function getAIProvider() {
  return process.env.GROQ_API_KEY ? "groq" : process.env.ANTHROPIC_API_KEY ? "anthropic" : null;
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

// Throws if no provider is configured or the request fails — callers that
// want silent best-effort behavior (like auto-summarize) should catch.
export async function generateWithAI(prompt) {
  const provider = getAIProvider();
  if (!provider) throw new Error("No AI provider configured (set GROQ_API_KEY or ANTHROPIC_API_KEY).");
  const result = provider === "groq" ? await callGroq(prompt) : await callAnthropic(prompt);
  return { result, provider };
}
