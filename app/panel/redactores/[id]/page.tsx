import { notFound } from "next/navigation";
import WriterForm from "@/components/WriterForm";
import { requireUser } from "@/lib/auth";
import { getWriter, getWriters } from "@/lib/data";

export default async function EditWriter({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [w, all] = await Promise.all([getWriter(user.id, id), getWriters(user.id)]);
  if (!w) notFound();
  return (
    <WriterForm
      mode="edit"
      id={w.id}
      canDelete={all.length > 1}
      initial={{
        kind: w.kind,
        animal: w.animal,
        name: w.name,
        about: w.about,
        formality: w.formality,
        length: w.length,
        emojis: w.emojis,
        sample: w.sample,
        format: w.format,
        avatar: w.avatar || "✍️",
        color: w.color || "#6D4AFF",
        profile: w.custom,
      }}
    />
  );
}
