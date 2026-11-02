import Link from "next/link";
import TopicsManager, { type TopicLite } from "@/components/TopicsManager";
import { requireUser } from "@/lib/auth";
import { listWriters } from "@/lib/data";
import { eq, select } from "@/lib/db";
import { mailEnabled } from "@/lib/email";
import { lookOf } from "@/lib/newsletter";
import { madridToday } from "@/lib/topics";

export default async function TopicsPage() {
  const user = await requireUser();
  const [writers, topics] = await Promise.all([
    listWriters(user.id),
    select<TopicLite>("topics", { user_id: eq(user.id), order: "scheduled_day.asc.nullslast,created_at.desc", limit: 200 }),
  ]);
  return (
    <div>
      <h1 className="text-3xl font-bold">Temas</h1>
      <p className="mt-1 mb-6 text-muted">Apunta ideas y prográmalas: tu redactor las escribe solo el día y la hora que elijas.</p>
      {writers.length === 0 ? (
        <div className="card p-6">
          <p>Primero necesitas un redactor.</p>
          <Link href="/panel" className="btn btn-primary mt-4">Contratar uno</Link>
        </div>
      ) : (
        <TopicsManager topics={topics} writers={writers.map((w) => ({ id: w.id!, name: w.name, look: lookOf(w) }))} today={madridToday()} mailOn={mailEnabled()} />
      )}
    </div>
  );
}
