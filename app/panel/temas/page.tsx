import Link from "next/link";
import TopicsManager, { type TopicView, type TopicWriter } from "@/components/TopicsManager";
import { requireUser } from "@/lib/auth";
import { countConfirmed, getWriters } from "@/lib/data";
import { listTopics, madridToday } from "@/lib/topics";

export default async function TopicsPage() {
  const user = await requireUser();
  const [writers, topics, confirmed] = await Promise.all([getWriters(user.id), listTopics(user.id), countConfirmed(user.id)]);

  if (writers.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="font-semibold">Primero necesitas un redactor</p>
        <Link href="/panel/redactores/nuevo" className="btn btn-primary mt-5">Crear mi redactor</Link>
      </div>
    );
  }

  const tw: TopicWriter[] = writers.map((w) => ({ id: w.id, name: w.name, kind: w.kind, animal: w.animal, avatar: w.avatar, color: w.color, format: w.format }));
  const tv: TopicView[] = topics.map((t) => ({
    id: t.id,
    writer_id: t.writer_id,
    title: t.title,
    notes: t.notes,
    format: t.format,
    scheduled_day: t.scheduled_day,
    send_hour: t.send_hour,
    mode: t.mode,
    status: t.status,
    newsletter_id: t.newsletter_id,
    error: t.error,
  }));

  return (
    <div>
      <h1 className="text-3xl font-bold">Temas</h1>
      <p className="mb-8 mt-2 max-w-2xl text-muted">
        Apunta tus ideas y elige qué redactor y qué estilo quieres para cada una. Si les pones un día, se escriben solas a primera hora y te aviso.
      </p>
      <TopicsManager topics={tv} writers={tw} today={madridToday()} confirmed={confirmed} />
    </div>
  );
}
