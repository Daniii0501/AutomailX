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

/** Precio de Premium (euros, IVA incluido). Cámbialo aquí. */
export const PRICE = { monthly: 9, yearly: 79 } as const;
export const yearlySaving = () => Math.round(100 - (PRICE.yearly / (PRICE.monthly * 12)) * 100);

/** Mientras no haya pago con tarjeta, Premium se solicita y lo activa el administrador. */
export const CHECKOUT_ENABLED = false;

export const PREMIUM_FEATURES = [
  { icon: "✉️", title: "Tu propio dominio", text: "Tus newsletters salen desde hola@tunegocio.com: más confianza, mejor entrega y tu marca en cada correo." },
  { icon: "✍️", title: "Newsletters sin límite", text: `Escribe todas las que necesites. En el plan gratis son ${FREE.writesPerWeek} a la semana.` },
  { icon: "📊", title: "Métricas completas", text: "Aperturas, clics y enlaces más pulsados de cada campaña, también con tu dominio." },
] as const;
