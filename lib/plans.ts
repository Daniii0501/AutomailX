/**
 * Planes de AutoMailX. Todo lo que es decisión de negocio (límites, precio, ventajas) está aquí:
 * cámbialo en este archivo y se actualiza en toda la web.
 */

export type PlanId = "free" | "pro";

const COMMON = {
  writers: 2,
  subscribers: 200,
  revisionsPerDay: 40,
  sendsPerDay: 3,
  testsPerDay: 15,
};

/** Plan gratis. */
export const FREE = { ...COMMON, writesPerWeek: 8 } as const;

/** Premium. "Sin límite" de newsletters, con un tope alto de uso razonable para proteger el gasto de IA. */
export const PRO = { ...COMMON, writesPerWeek: 150 } as const;

export const limitsFor = (plan: PlanId) => (plan === "pro" ? PRO : FREE);

/** Precio de Premium: euros al mes, IVA incluido. Cámbialo aquí (y la web crea el precio nuevo en Stripe sola). */
export const PRICE = { monthly: 12.7 } as const;
/** En céntimos, para Stripe. */
export const PRICE_CENTS = Math.round(PRICE.monthly * 100);
/** "12,70 €" */
export const priceLabel = () => `${PRICE.monthly.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

export const PREMIUM_FEATURES = [
  { icon: "✉️", title: "Tu propio dominio", text: "Tus newsletters salen desde hola@tunegocio.com: más confianza, mejor entrega y tu marca en cada correo." },
  { icon: "✍️", title: "Newsletters sin límite", text: `Escribe todas las que necesites. En el plan gratis son ${FREE.writesPerWeek} a la semana.` },
  { icon: "📊", title: "Métricas completas", text: "Aperturas, clics y enlaces más pulsados de cada campaña, también con tu dominio." },
] as const;
