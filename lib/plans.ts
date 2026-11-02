/** Límites del plan gratuito. Es una decisión de negocio: cámbialos aquí. */
export const FREE = {
  writers: 2,
  subscribers: 200,
  aiPerDay: 20,
  revisionsPerDay: 40,
  sendsPerDay: 3,
  testsPerDay: 15,
} as const;

export const PRO_PRICE_HINT = "Pronto";
