import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Note from "@/models/Note";
import { getCurrentUserPayload } from "@/lib/getCurrentUser";

async function loadOwnedNote(id, userId) {
  const note = await Note.findOne({ _id: id, owner: userId });
  return note;
}

export async function GET(_req, { params }) {
  const user = await getCurrentUserPayload();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const note = await loadOwnedNote(params.id, user.userId);
  if (!note) return NextResponse.json({ error: "Note not found." }, { status: 404 });

  return NextResponse.json({ note });
}

export async function PUT(req, { params }) {
  const user = await getCurrentUserPayload();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const note = await loadOwnedNote(params.id, user.userId);
  if (!note) return NextResponse.json({ error: "Note not found." }, { status: 404 });

  const body = await req.json();

  // Snapshot the previous content into history before overwriting, but only
  // when the content actually changed and differs from the last snapshot —
  // keeps autosave from flooding history with near-duplicate entries.
  if (body.content !== undefined && body.content !== note.content) {
    const last = note.history[note.history.length - 1];
    if (!last || last.content !== note.content) {
      note.history.push({ content: note.content, savedAt: new Date() });
      if (note.history.length > 20) note.history = note.history.slice(-20);
    }
  }

  const fields = ["title", "tags", "project", "content", "citationStyle", "citations", "figures"];
  for (const f of fields) {
    if (body[f] !== undefined) note[f] = body[f];
  }
  await note.save();

  return NextResponse.json({ note });
}

export async function DELETE(_req, { params }) {
  const user = await getCurrentUserPayload();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const note = await loadOwnedNote(params.id, user.userId);
  if (!note) return NextResponse.json({ error: "Note not found." }, { status: 404 });

  await note.deleteOne();
  return NextResponse.json({ ok: true });
}
