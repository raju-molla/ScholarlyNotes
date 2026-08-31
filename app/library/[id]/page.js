import { notFound, redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Paper from "@/models/Paper";
import { getCurrentUserPayload } from "@/lib/getCurrentUser";
import PaperForm from "@/components/PaperForm";

export default async function PaperDetailPage({ params }) {
  const user = await getCurrentUserPayload();
  if (!user) redirect("/login");

  await connectDB();
  const paper = await Paper.findOne({ _id: params.id, owner: user.userId }).lean();
  if (!paper) notFound();

  const initial = JSON.parse(JSON.stringify(paper));

  return <PaperForm paperId={params.id} initial={initial} />;
}
