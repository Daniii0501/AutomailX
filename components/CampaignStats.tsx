import { plural } from "@/lib/format-utils";
import { baseOf, pct, rate, type CampaignStat } from "@/lib/stats";

function Num({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

/** Resultados de una campaña enviada (va encima del correo en su página). */
export default function CampaignStats({ c, links, tracking }: { c: CampaignStat; links: { url: string; clicks: number }[]; tracking: boolean }) {
  const b = baseOf(c);
  const has = c.tracked > 0;
  const maxClicks = Math.max(1, ...links.map((l) => l.clicks));
  return (
    <section className="card p-5" aria-label="Resultados de la campaña">
      <h2 className="font-bold">Resultados</h2>
      {!has ? (
        <p className="mt-1 text-sm text-muted">
          {c.delivery === "demo"
            ? "Se envió en modo prueba (sin correos reales), así que no hay aperturas ni clics."
            : tracking
              ? "Esta campaña se envió antes de activar las métricas: solo tenemos el número de envíos y las bajas."
              : "Conecta los avisos de Resend (en Métricas te explicamos cómo) para ver aperturas y clics."}
        </p>
      ) : null}
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Num label="Enviados" value={String(c.recipients)} />
        <Num label="Aperturas" value={pct(has ? rate(c.opened, b) : null)} sub={has ? `${plural(c.opened, "persona", "personas")} · ${plural(c.total_opens, "vez", "veces")}` : undefined} />
        <Num label="Clics" value={pct(has ? rate(c.clicked, b) : null)} sub={has ? `${plural(c.clicked, "persona", "personas")} · ${plural(c.total_clicks, "clic", "clics")}` : undefined} />
        <Num label="Bajas" value={String(c.unsubscribed)} sub={has ? `${plural(c.bounced, "rebote", "rebotes")} · ${c.complained} spam` : undefined} />
      </div>
      {links.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-semibold">Enlaces más pulsados</p>
          <ul className="mt-2 space-y-2">
            {links.map((l) => (
              <li key={l.url} className="text-sm">
                <div className="flex justify-between gap-3">
                  <span className="truncate text-muted" title={l.url}>{l.url.replace(/^https?:\/\//, "")}</span>
                  <span className="shrink-0 font-semibold tabular-nums">{l.clicks}</span>
                </div>
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[#f1eff8]" aria-hidden>
                  <span className="block h-full rounded-full bg-brand" style={{ width: `${(l.clicks / maxClicks) * 100}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
