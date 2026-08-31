import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Draft from "@/models/Draft";
import { getCurrentUserPayload } from "@/lib/getCurrentUser";

async function loadOwnedDraft(id, userId) {
  return Draft.findOne({ _id: id, owner: userId });
}

export async function GET(_req, { params }) {
  const user = await getCurrentUserPayload();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const draft = await loadOwnedDraft(params.id, user.userId);
  if (!draft) return NextResponse.json({ error: "Draft not found." }, { status: 404 });

  return NextResponse.json({ draft });
}

export async function PUT(req, { params }) {
  const user = await getCurrentUserPayload();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const draft = await loadOwnedDraft(params.id, user.userId);
  if (!draft) return NextResponse.json({ error: "Draft not found." }, { status: 404 });

  const body = await req.json();

  if (body.sections !== undefined) {
    // JSON round-trip works for both the array-of-sections shape and plain
    // objects, and sidesteps Mongoose subdocument/array quirks with toObject().
    const prevSnapshot = JSON.parse(JSON.stringify(draft.sections || []));
    const changed = JSON.stringify(body.sections) !== JSON.stringify(prevSnapshot);
    if (changed) {
      const last = draft.history[draft.history.length - 1];
      if (!last || JSON.stringify(last.sections) !== JSON.stringify(prevSnapshot)) {
        draft.history.push({ sections: prevSnapshot, savedAt: new Date() });
        if (draft.history.length > 20) draft.history = draft.history.slice(-20);
      }
    }
  }

  const fields = ["title", "subtitle", "project", "tags", "citationStyle", "citations", "sections", "targets", "figures"];
  for (const f of fields) {
    if (body[f] !== undefined) draft[f] = body[f];
  }
  await draft.save();

  return NextResponse.json({ draft });
}

export async function DELETE(_req, { params }) {
  const user = await getCurrentUserPayload();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const draft = await loadOwnedDraft(params.id, user.userId);
  if (!draft) return NextResponse.json({ error: "Draft not found." }, { status: 404 });

  await draft.deleteOne();
  return NextResponse.json({ ok: true });
}
