import "server-only";
import { fail } from "./http";

/** Los crons llegan con `Authorization: Bearer CRON_SECRET` (Vercel lo pone solo si la variable existe). */
export function cronGuard(req: Request): Response | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return fail("Falta la variable CRON_SECRET en Vercel.", 401);
  if (req.headers.get("authorization") !== `Bearer ${secret}`) return fail("No autorizado.", 401);
  return null;
}
