import { notFound, redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Draft from "@/models/Draft";
import { getCurrentUserPayload } from "@/lib/getCurrentUser";
import DraftEditor from "@/components/DraftEditor";

export default async function EditDraftPage({ params }) {
  const user = await getCurrentUserPayload();
  if (!user) redirect("/login");

  await connectDB();
  const draft = await Draft.findOne({ _id: params.id, owner: user.userId }).lean();
  if (!draft) notFound();

  const initial = JSON.parse(JSON.stringify(draft));

  return <DraftEditor draftId={params.id} initial={initial} />;
}
