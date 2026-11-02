/** Utilidades sin dependencias de servidor (se pueden usar en el navegador). */

export const isUuid = (s: unknown): s is string =>
  typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

/** Fecha corta en español de España. */
export function fecha(iso: string | null | undefined, withTime = false): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "short",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
