import "server-only";
import { rpc } from "./db";

/** Suma 1 al contador de hoy (día de España) y dice si sigue dentro del límite. */
export async function hit(key: string, limit: number): Promise<boolean> {
  return (await rpc<boolean>("amx_hit", { p_key: key, p_limit: limit })) === true;
}

/** Cuántas veces se ha usado hoy, sin sumar. */
export async function used(key: string): Promise<number> {
  return Number(await rpc<number>("amx_count", { p_key: key })) || 0;
}

export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}
