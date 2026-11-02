import { notFound } from "next/navigation";
import Editor from "@/components/Editor";
import { requireUser } from "@/lib/auth";
import { suspiciousNumbers } from "@/lib/ai";
import { countConfirmed, getNewsletter, getPublication, getWriter } from "@/lib/data";

export default async function NewsletterPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const n = await getNewsletter(user.id, id);
  if (!n) notFound();
  const [writer, pub, confirmed] = await Promise.all([getWriter(user.id, n.writer_id), getPublication(user.id), countConfirmed(user.id)]);
  if (!writer) notFound();

  return (
    <Editor
      key={`${n.id}-${n.status}`}
      id={n.id}
      status={n.status}
      delivery={n.delivery}
      recipients={n.recipients}
      sentAt={n.sent_at}
      initial={n.content}
      brief={n.brief}
      writer={{ name: writer.name, kind: writer.kind, animal: writer.animal, avatar: writer.avatar, color: writer.color }}
      source={n.source}
      warnings={suspiciousNumbers(n.brief, n.content)}
      publicationName={pub.name}
      confirmed={confirmed}
      userEmail={user.email}
    />
  );
}
