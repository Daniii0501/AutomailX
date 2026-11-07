import Link from "next/link";
import { PremiumFaq, PremiumFeatures } from "@/components/PremiumInfo";
import PricingCards from "@/components/PricingCards";
import { requireUser } from "@/lib/auth";
import { getAccount } from "@/lib/data";
import { eq, isNull, one } from "@/lib/db";
import { getDomain } from "@/lib/domains";
import { limitsFor } from "@/lib/plans";
import { usedWeek } from "@/lib/rate";

export const metadata = { title: "Premium · AutoMailX" };

export default async function PanelPremiumPage() {
  const user = await requireUser();
  const [account, used, request, domain] = await Promise.all([
    getAccount(user.id),
    usedWeek(`write-week:${user.id}`),
    one<{ billing: "monthly" | "yearly"; created_at: string }>("premium_requests", { select: "billing,created_at", user_id: eq(user.id), handled_at: isNull }),
    getDomain(user.id),
  ]);
  const limit = limitsFor(account.plan).writesPerWeek;
  const isPro = account.plan === "pro";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{isPro ? "Tu plan Premium ✨" : "Pásate a Premium"}</h1>
        <p className="mt-1 text-muted">
          {isPro ? "Gracias por apoyar AutoMailX. Esto es lo que tienes:" : "Envía desde tu propio dominio y escribe sin límites."}
        </p>
      </div>

      <section aria-label="Tu uso" className="grid gap-3 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-sm text-muted">Newsletters esta semana</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{isPro ? used : `${Math.min(used, limit)} de ${limit}`}</p>
          {!isPro && (
            <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[#f1eff8]" aria-hidden>
              <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (used / limit) * 100)}%` }} />
            </span>
          )}
          <p className="mt-1 text-xs text-muted">{isPro ? "Sin límite." : "Se reinicia cada lunes."}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-muted">Dominio de envío</p>
          <p className="mt-1 truncate text-2xl font-bold">{domain && isPro && domain.status === "verified" ? domain.name : isPro ? (domain ? "Pendiente" : "Sin configurar") : "AutoMailX"}</p>
          <p className="mt-1 text-xs text-muted">
            {isPro ? <Link href="/panel/ajustes" className="font-semibold text-brand hover:underline">{domain ? "Ver en Ajustes →" : "Configúralo en Ajustes →"}</Link> : "Con Premium, el tuyo."}
          </p>
        </div>
      </section>

      <PremiumFeatures />

      <section aria-labelledby="planes">
        <h2 id="planes" className="mb-4 text-xl font-bold">Planes</h2>
        <PricingCards context="app" plan={account.plan} requested={request} />
      </section>

      <section aria-labelledby="faq">
        <h2 id="faq" className="mb-4 text-xl font-bold">Preguntas frecuentes</h2>
        <PremiumFaq />
      </section>
    </div>
  );
}
