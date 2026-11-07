import Link from "next/link";
import Brand from "@/components/Brand";
import { PremiumFaq, PremiumFeatures } from "@/components/PremiumInfo";
import PricingCards from "@/components/PricingCards";
import { PRICE } from "@/lib/plans";

export const metadata = {
  title: "Premium · AutoMailX",
  description: `Newsletters sin límite y envío desde tu propio dominio por ${PRICE.monthly} € al mes.`,
};

export default function PremiumPage() {
  return (
    <div className="overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Brand />
        <Link href="/login" className="btn btn-soft !px-4 !py-2 text-sm">Entrar</Link>
      </header>
      <main className="mx-auto max-w-4xl space-y-16 px-4 pt-8 pb-24 sm:px-6">
        <section className="text-center">
          <span className="pill bg-[#f1edff] text-brand">AutoMailX Premium</span>
          <h1 className="mx-auto mt-4 max-w-2xl text-[2.4rem] leading-tight font-bold sm:text-5xl">
            Tu newsletter, <span className="text-gradient">con tu nombre y sin límites</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
            Envía desde tu propio dominio y escribe todas las newsletters que quieras. Por {PRICE.monthly} € al mes.
          </p>
        </section>

        <PremiumFeatures />

        <section aria-labelledby="planes">
          <h2 id="planes" className="mb-6 text-center text-3xl font-bold">Elige tu plan</h2>
          <PricingCards context="public" />
        </section>

        <section aria-labelledby="faq">
          <h2 id="faq" className="mb-6 text-center text-3xl font-bold">Preguntas frecuentes</h2>
          <PremiumFaq />
        </section>
      </main>
    </div>
  );
}
