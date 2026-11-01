import Link from "next/link";
import { redirect } from "next/navigation";
import Animal from "@/components/Animal";
import Composer from "@/components/Composer";
import { requireUser } from "@/lib/auth";
import { countConfirmed, getWriters, listNewsletters } from "@/lib/data";
import { FREE } from "@/lib/plans";

const fmt = (ms: number) =>
  new Date(ms).toLocaleDateString("es-ES", { day: "numeric", month: "short" });

export default async function PanelHome({ searchParams }: { searchParams: Promise<{ w?: string }> }) {
  const user = await requireUser();
  const writers = await getWriters(user.id);
  if (writers.length === 0) redirect("/panel/redactores/nuevo");

  const { w } = await searchParams;
  const writer = writers.find((x) => x.id === w) ?? writers[0];
  const [recent, confirmed] = await Promise.all([listNewsletters(user.id, 6), countConfirmed(user.id)]);
  const byWriter = new Map(writers.map((x) => [x.id, x]));

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {writers.map((x) => (
            <Link
              key={x.id}
              href={`/panel?w=${x.id}`}
              className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-4 text-sm font-medium transition ${x.id === writer.id ? "border-ink bg-white shadow-sm" : "border-line bg-white/60 text-muted hover:text-ink"}`}
            >
              <Animal id={x.animal} size={30} />
              {x.name}
            </Link>
          ))}
          {writers.length < FREE.writers && (
            <Link href="/panel/redactores/nuevo" className="rounded-full border border-dashed border-line px-4 py-2 text-sm text-muted hover:border-ink hover:text-ink">
              + Nuevo redactor
            </Link>
          )}
          <Link href={`/panel/redactores/${writer.id}`} className="ml-auto text-sm text-muted hover:text-ink">
            Ajustar a {writer.name}
          </Link>
        </div>
        <Composer key={writer.id} writer={{ id: writer.id, name: writer.name, animal: writer.animal }} />
      </section>

      {confirmed === 0 && (
        <Link href="/panel/audiencia" className="card flex items-center justify-between gap-4 p-5 transition hover:shadow-lg">
          <div>
            <p className="font-semibold">Aún no tienes suscriptores</p>
            <p className="text-sm text-muted">Añade a tu gente o comparte tu página de suscripción para poder enviar.</p>
          </div>
          <span className="btn btn-soft shrink-0">Añadir</span>
        </Link>
      )}

      <section>
        <h2 className="mb-4 text-xl font-semibold">Tus newsletters</h2>
        {recent.length === 0 ? (
          <p className="card p-8 text-center text-muted">Todavía no hay ninguna. Cuéntale algo a {writer.name} y aparecerá aquí.</p>
        ) : (
          <ul className="space-y-3">
            {recent.map((n) => {
              const wr = byWriter.get(n.writer_id);
              return (
                <li key={n.id}>
                  <Link href={`/panel/n/${n.id}`} className="card flex items-center gap-4 p-4 transition hover:shadow-lg">
                    {wr ? <Animal id={wr.animal} size={44} className="shrink-0" /> : <div className="h-11 w-11 shrink-0 rounded-full bg-line" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{n.content.subject}</p>
                      <p className="text-sm text-muted">
                        {n.status === "sent" ? `Enviada el ${fmt(n.sent_at ?? n.updated_at)} a ${n.recipients}` : `Borrador · ${fmt(n.updated_at)}`}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${n.status === "sent" ? "bg-ok/10 text-ok" : "bg-amber-100 text-amber-800"}`}>
                      {n.status === "sent" ? "Enviada" : n.status === "sending" ? "Enviando" : "Borrador"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
