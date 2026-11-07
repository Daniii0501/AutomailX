"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/client";
import { FREE, PRICE, yearlySaving, type PlanId } from "@/lib/plans";

type Billing = "monthly" | "yearly";
type Props = {
  /** public: portada y /premium. app: dentro del panel. */
  context: "public" | "app";
  plan?: PlanId;
  requested?: { billing: Billing; created_at: string } | null;
};

const eur = (n: number) => `${n.toLocaleString("es-ES")} €`;

const FREE_LIST = [
  `${FREE.writesPerWeek} newsletters a la semana`,
  `${FREE.writers} redactores con personalidad`,
  `Hasta ${FREE.subscribers} suscriptores`,
  "Métricas de tus campañas",
  "Temas programados",
  "Envío desde el dominio de AutoMailX",
];

const PRO_LIST = [
  "Newsletters sin límite",
  "Tu propio dominio: hola@tunegocio.com",
  "Métricas completas con tu dominio",
  "Todo lo del plan gratis",
];

function Check({ strong }: { strong?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden className={`mt-0.5 shrink-0 ${strong ? "text-brand" : "text-muted"}`}>
      <path d="M5 10.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PricingCards({ context, plan = "free", requested = null }: Props) {
  const [billing, setBilling] = useState<Billing>(requested?.billing ?? "monthly");
  const [sent, setSent] = useState(!!requested);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isPro = plan === "pro";
  const price = billing === "monthly" ? PRICE.monthly : PRICE.yearly;

  async function request() {
    setBusy(true);
    setError("");
    try {
      await api("/api/premium/request", { body: { billing } });
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  let cta: React.ReactNode;
  if (context === "public") {
    cta = <Link href="/login" className="btn btn-primary w-full">Empezar y pasar a Premium</Link>;
  } else if (isPro) {
    cta = <p className="rounded-full bg-[#f1edff] py-3 text-center font-semibold text-brand">✓ Es tu plan actual</p>;
  } else if (sent) {
    cta = (
      <p className="banner banner-ok text-sm">
        ¡Recibido! Te escribiremos a tu correo para activar Premium ({billing === "monthly" ? "mensual" : "anual"}). Suele ser en menos de 24 horas.
      </p>
    );
  } else {
    cta = (
      <button className="btn btn-primary w-full" onClick={request} disabled={busy}>
        {busy ? "Enviando…" : "Quiero Premium"}
      </button>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-center">
        <div role="radiogroup" aria-label="Forma de pago" className="inline-flex rounded-full border border-line bg-white p-1">
          {(["monthly", "yearly"] as const).map((b) => (
            <button key={b} role="radio" aria-checked={billing === b} onClick={() => setBilling(b)} disabled={sent && context === "app"}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${billing === b ? "bg-ink text-white" : "text-ink"}`}>
              {b === "monthly" ? "Mensual" : <>Anual <span className={billing === b ? "text-white/80" : "text-ok"}>−{yearlySaving()} %</span></>}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Gratis */}
        <div className="card flex flex-col p-6">
          <p className="text-lg font-bold">Gratis</p>
          <p className="mt-1 text-sm text-muted">Para empezar y probar.</p>
          <p className="mt-4 text-4xl font-bold">0 €</p>
          <ul className="mt-5 flex-1 space-y-2.5 text-sm">
            {FREE_LIST.map((f) => <li key={f} className="flex gap-2"><Check />{f}</li>)}
          </ul>
          <div className="mt-6">
            {context === "public" ? (
              <Link href="/login" className="btn btn-soft w-full">Empezar gratis</Link>
            ) : !isPro ? (
              <p className="rounded-full bg-[#f4f2ef] py-3 text-center font-semibold text-muted">Tu plan actual</p>
            ) : null}
          </div>
        </div>

        {/* Premium */}
        <div className="card relative flex flex-col overflow-hidden p-6 ring-2 ring-brand">
          <span className="pill absolute top-5 right-5 bg-brand text-white">Recomendado</span>
          <p className="text-lg font-bold">Premium</p>
          <p className="mt-1 text-sm text-muted">Para negocios que envían en serio.</p>
          <p className="mt-4">
            <span className="text-4xl font-bold">{eur(price)}</span>
            <span className="text-muted"> / {billing === "monthly" ? "mes" : "año"}</span>
          </p>
          <p className="text-xs text-muted">{billing === "yearly" ? `Equivale a ${eur(Math.round((PRICE.yearly / 12) * 100) / 100)} al mes.` : "IVA incluido. Cancela cuando quieras."}</p>
          <ul className="mt-5 flex-1 space-y-2.5 text-sm">
            {PRO_LIST.map((f, i) => <li key={f} className={`flex gap-2 ${i < 2 ? "font-semibold" : ""}`}><Check strong />{f}</li>)}
          </ul>
          <div className="mt-6 space-y-2">
            {cta}
            {error && <p role="alert" className="banner banner-err text-sm">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
