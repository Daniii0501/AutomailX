import { redirect } from "next/navigation";
import WriterForm from "@/components/WriterForm";
import { requireUser } from "@/lib/auth";
import { getWriters } from "@/lib/data";
import { FREE } from "@/lib/plans";

export default async function NewWriter() {
  const user = await requireUser();
  const writers = await getWriters(user.id);
  if (writers.length >= FREE.writers) redirect("/panel");
  return <WriterForm mode="new" />;
}
