import { FREE, PREMIUM_FEATURES } from "@/lib/plans";

export function PremiumFeatures() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {PREMIUM_FEATURES.map((f) => (
        <div key={f.title} className="card p-5">
          <span className="text-2xl" aria-hidden>{f.icon}</span>
          <p className="mt-2 font-bold">{f.title}</p>
          <p className="mt-1 text-sm text-muted">{f.text}</p>
        </div>
      ))}
    </div>
  );
}

const FAQ = [
  {
    q: "¿Qué necesito para enviar desde mi dominio?",
    a: "Tener un dominio propio (por ejemplo tunegocio.com). Te damos tres datos para copiar en la web donde lo compraste y te guiamos paso a paso. No hace falta saber nada técnico.",
  },
  {
    q: "¿Y si no tengo dominio?",
    a: "Puedes comprar uno en cualquier proveedor por unos 10 € al año. Mientras tanto, Premium te da newsletters sin límite y tus correos salen desde el dominio de AutoMailX.",
  },
  {
    q: "¿Qué pasa si vuelvo al plan gratis?",
    a: `No pierdes nada: tus newsletters, tu lista y tus métricas se quedan. Vuelves a ${FREE.writesPerWeek} newsletters a la semana y tus correos salen otra vez desde el dominio de AutoMailX.`,
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí, sin permanencia. Desde «Gestionar mi suscripción» cancelas en dos clics y sigues con Premium hasta el final del mes que ya has pagado.",
  },
  {
    q: "¿Cómo se paga?",
    a: "Con tarjeta, en la página segura de Stripe. Nosotros no vemos ni guardamos tu tarjeta. Recibes la factura por correo cada mes y puedes descargarlas en «Gestionar mi suscripción».",
  },
];

export function PremiumFaq() {
  return (
    <div className="space-y-2">
      {FAQ.map((f) => (
        <details key={f.q} className="card group p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
            {f.q}
            <span aria-hidden className="text-muted transition group-open:rotate-45">+</span>
          </summary>
          <p className="mt-2 text-sm text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
