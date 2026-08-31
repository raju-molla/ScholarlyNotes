import { notFound, redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Note from "@/models/Note";
import { getCurrentUserPayload } from "@/lib/getCurrentUser";
import NoteEditor from "@/components/NoteEditor";

export default async function EditNotePage({ params }) {
  const user = await getCurrentUserPayload();
  if (!user) redirect("/login");

  await connectDB();
  const note = await Note.findOne({ _id: params.id, owner: user.userId }).lean();
  if (!note) notFound();

  const initial = JSON.parse(JSON.stringify(note));

  return <NoteEditor noteId={params.id} initial={initial} />;
}
