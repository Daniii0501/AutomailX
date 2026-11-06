import { headers } from "next/headers";
import Link from "next/link";
import GrowthChart from "@/components/GrowthChart";
import WriterAvatar from "@/components/WriterAvatar";
import { requireUser } from "@/lib/auth";
import { count, eq, gte, inList } from "@/lib/db";
import { mailEnabled } from "@/lib/email";
import { fecha, plural } from "@/lib/format-utils";
import { DEFAULT_LOOK } from "@/lib/newsletter";
import { baseOf, campaignStats, growth, isPeriod, pct, rate, sinceOf, totals, type Period } from "@/lib/stats";
import { webhookConfigured } from "@/lib/webhook";

export const metadata = { title: "Métricas · AutoMailX" };

type SP = Promise<{ p?: string }>;

const PERIOD_LABEL: Record<Period, string> = { "30": "30 días", "90": "90 días", todo: "Todo" };

function Tile({ label, value, sub, hint }: { label: string; value: string; sub?: string; hint?: string }) {
  return (
    <div className="card p-4" title={hint}>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums sm:text-3xl">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

/** Barra fina 0–100 % para las tasas de la tabla (el número va al lado, en texto). */
function Meter({ value }: { value: number | null }) {
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-[#f1eff8]" aria-hidden>
      {value !== null && value > 0 && <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.max(3, value * 100)}%` }} />}
    </span>
  );
}

export default async function StatsPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const { p } = await searchParams;
  const period: Period = isPeriod(p) ? p : "90";
  const since = sinceOf(period);

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const site = process.env.APP_URL || `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
  const [campaigns, weeks, active, newSubs] = await Promise.all([
    campaignStats(user.id, since),
    growth(user.id, 12),
    count("subscribers", { user_id: eq(user.id), status: eq("confirmed") }),
    since ? count("subscribers", { user_id: eq(user.id), confirmed_at: gte(since), status: inList(["confirmed"]) }) : Promise.resolve(null),
  ]);
  const t = totals(campaigns);
  const base = baseOf(t);
  const tracking = webhookConfigured();
  const hasTracked = t.tracked > 0;
  const anyEvents = t.delivered + t.opened + t.clicked + t.bounced > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Métricas</h1>
          <p className="mt-1 text-muted">Cómo les va a tus newsletters.</p>
        </div>
        <nav aria-label="Periodo" className="inline-flex rounded-full border border-line bg-white p-1">
          {(Object.keys(PERIOD_LABEL) as Period[]).map((k) => (
            <Link key={k} href={`/panel/estadisticas?p=${k}`} aria-current={k === period ? "page" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${k === period ? "bg-ink text-white" : "text-ink"}`}>
              {PERIOD_LABEL[k]}
            </Link>
          ))}
        </nav>
      </div>

      {!tracking && (
        <div className="banner banner-info">
          <p><strong>Falta un paso para ver aperturas y clics.</strong> Ahora ves envíos y bajas. Para el resto, conecta los avisos de Resend:</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>En resend.com → <strong>Webhooks</strong> → <strong>Add Webhook</strong>.</li>
            <li>En <strong>Endpoint URL</strong> pon <code className="break-all">{site}/api/webhooks/resend</code> y marca todos los eventos <code>email.*</code>.</li>
            <li>Copia el <strong>Signing Secret</strong> (empieza por <code>whsec_</code>) y guárdalo en Vercel como <code>RESEND_WEBHOOK_SECRET</code>.</li>
            <li>En Resend → <strong>Domains</strong> → tu dominio, activa <strong>Open Tracking</strong> y <strong>Click Tracking</strong>.</li>
          </ol>
        </div>
      )}
      {tracking && hasTracked && !anyEvents && (
        <p className="banner banner-info">Aún no han llegado datos de Resend. Las entregas tardan unos segundos y las aperturas, lo que tarde la gente en abrir. Si pasan horas sin datos, revisa que <strong>Open Tracking</strong> y <strong>Click Tracking</strong> estén activados en Resend → Domains.</p>
      )}

      {/* Cifras principales */}
      <section aria-label="Resumen" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Suscriptores activos" value={active.toLocaleString("es-ES")} sub={newSubs !== null ? `+${newSubs} en ${PERIOD_LABEL[period]}` : undefined} />
        <Tile label="Correos enviados" value={t.sent.toLocaleString("es-ES")} sub={plural(t.campaigns, "campaña", "campañas")} />
        <Tile label="Tasa de apertura" value={pct(rate(t.opened, base))} sub={hasTracked ? `${t.opened} de ${plural(base, "persona", "personas")}` : "sin datos aún"}
          hint="Personas distintas que abrieron, entre las que lo recibieron. Es aproximada: algunos programas de correo abren solos." />
        <Tile label="Tasa de clics" value={pct(rate(t.clicked, base))} sub={hasTracked ? `${t.clicked} de ${plural(base, "persona", "personas")}` : "sin datos aún"} />
        <Tile label="Entregados" value={pct(rate(t.delivered, t.tracked))} sub={hasTracked ? `${t.delivered} de ${t.tracked}` : "sin datos aún"} />
        <Tile label="Bajas" value={t.unsubscribed.toLocaleString("es-ES")} sub={t.sent ? `${pct(rate(t.unsubscribed, t.sent), 1)} de lo enviado` : undefined} />
        <Tile label="Rebotes" value={t.bounced.toLocaleString("es-ES")} sub="correos que no existen o están llenos" />
        <Tile label="Marcados como spam" value={t.complained.toLocaleString("es-ES")} sub={t.complained ? "se les da de baja solos" : "ninguno, ¡bien!"} />
      </section>

      {/* Crecimiento */}
      <section className="card p-5">
        <h2 className="font-bold">Altas por semana</h2>
        <p className="text-sm text-muted">Personas que confirmaron su suscripción. Últimas 12 semanas.</p>
        <div className="mt-4">
          <GrowthChart weeks={weeks} />
        </div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold text-muted">Ver como tabla</summary>
          <table className="mt-2 w-full text-left tabular-nums">
            <thead className="text-muted"><tr><th className="py-1 font-medium">Semana</th><th className="font-medium">Altas</th><th className="font-medium">Bajas</th></tr></thead>
            <tbody>
              {weeks.map((w) => (
                <tr key={w.week} className="border-t border-line"><td className="py-1">{fecha(w.week)}</td><td>{w.joined}</td><td>{w.left}</td></tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      {/* Campañas */}
      <section>
        <h2 className="mb-2 text-lg font-bold">Campañas</h2>
        {campaigns.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-muted">No has enviado ninguna newsletter {period === "todo" ? "todavía" : `en los últimos ${PERIOD_LABEL[period]}`}.</p>
            <Link href="/panel" className="btn btn-primary mt-4">Escribir una</Link>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="hidden grid-cols-[1fr_5rem_7rem_7rem_4rem] gap-4 border-b border-line px-4 py-2 text-xs font-semibold text-muted sm:grid">
              <span>Campaña</span><span className="text-right">Enviados</span><span>Aperturas</span><span>Clics</span><span className="text-right">Bajas</span>
            </div>
            <ul className="divide-y divide-line">
              {campaigns.map((c) => {
                const b = baseOf(c);
                const open = c.tracked ? rate(c.opened, b) : null;
                const click = c.tracked ? rate(c.clicked, b) : null;
                return (
                  <li key={c.id}>
                    <Link href={`/panel/n/${c.id}`} className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 py-3 hover:bg-[#faf9f7] sm:grid-cols-[1fr_5rem_7rem_7rem_4rem] sm:items-center">
                      <span className="col-span-2 flex min-w-0 items-center gap-3 sm:col-span-1">
                        <WriterAvatar look={c.look?.color ? c.look : DEFAULT_LOOK} size={32} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{c.subject}</span>
                          <span className="text-xs text-muted">{fecha(c.sent_at)}{c.delivery === "demo" ? " · modo prueba" : ""}</span>
                        </span>
                      </span>
                      <span className="text-sm tabular-nums sm:text-right"><span className="text-muted sm:hidden">Enviados: </span>{c.recipients}</span>
                      <span className="text-sm tabular-nums sm:text-right sm:hidden"><span className="text-muted">Bajas: </span>{c.unsubscribed}</span>
                      <span className="space-y-1 text-sm tabular-nums"><span className="block"><span className="text-muted sm:hidden">Aperturas: </span>{pct(open)}</span><Meter value={open} /></span>
                      <span className="space-y-1 text-sm tabular-nums"><span className="block"><span className="text-muted sm:hidden">Clics: </span>{pct(click)}</span><Meter value={click} /></span>
                      <span className="hidden text-right text-sm tabular-nums sm:block">{c.unsubscribed}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {!mailEnabled() && <p className="hint">Las campañas en «modo prueba» no salen de verdad, así que no tienen aperturas ni clics.</p>}
      </section>
    </div>
  );
}
