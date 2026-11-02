import { notFound } from "next/navigation";
import WriterForm from "@/components/WriterForm";
import { requireUser } from "@/lib/auth";
import { getWriter } from "@/lib/data";

type P = Promise<{ id: string }>;

export default async function EditWriterPage({ params }: { params: P }) {
  const user = await requireUser();
  const { id } = await params;
  const w = await getWriter(user.id, id);
  if (!w) notFound();
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Editar a {w.name}</h1>
      <WriterForm initial={w} />
    </div>
  );
}
