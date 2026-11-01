import Link from "next/link";
import Animal from "@/components/Animal";
import { requireUser } from "@/lib/auth";
import { getWriters, listNewsletters } from "@/lib/data";

const fmt = (ms: number) => new Date(ms).toLocaleString("es-ES", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function HistoryPage() {
  const user = await requireUser();
  const [list, writers] = await Promise.all([listNewsletters(user.id, 100), getWriters(user.id)]);
  const byId = new Map(writers.map((w) => [w.id, w]));

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Historial</h1>
      {list.length === 0 ? (
        <p className="card p-10 text-center text-muted">Aquí aparecerán tus newsletters.</p>
      ) : (
        <ul className="space-y-3">
          {list.map((n) => {
            const w = byId.get(n.writer_id);
            return (
              <li key={n.id}>
                <Link href={`/panel/n/${n.id}`} className="card flex items-center gap-4 p-4 transition hover:shadow-lg">
                  {w ? <Animal id={w.animal} size={44} className="shrink-0" /> : <div className="h-11 w-11 shrink-0 rounded-full bg-line" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{n.content.subject}</p>
                    <p className="text-sm text-muted">
                      {n.status === "sent"
                        ? `Enviada · ${fmt(n.sent_at ?? n.updated_at)} · ${n.recipients} ${n.recipients === 1 ? "persona" : "personas"}${n.delivery === "demo" ? " · simulada" : ""}`
                        : `Borrador · ${fmt(n.updated_at)}`}
                    </p>
                  </div>
                  <span className="text-muted" aria-hidden>›</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
