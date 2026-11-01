import { body } from "@/lib/api";
import { run } from "@/lib/db";
import { json, sameOrigin } from "@/lib/util";

/** Confirma una suscripción (doble confirmación). Es un POST para que los filtros de correo no confirmen solos. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Petición no permitida." }, 403);
  const { token } = await body<{ token?: string }>(req);
  if (typeof token !== "string" || !token) return json({ error: "Enlace no válido." }, 400);
  const n = await run("UPDATE subscribers SET status = 'confirmed' WHERE token = ? AND status IN ('pending','confirmed')", [token]);
  if (n === 0) return json({ error: "Este enlace no es válido o ya no está activo." }, 404);
  return json({ ok: true });
}
