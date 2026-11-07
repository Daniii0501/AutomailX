import { getAccount } from "@/lib/data";
import { enablePlatformTracking } from "@/lib/domains";
import { authed, fail, json } from "@/lib/http";

/** Solo administradores: activa aperturas y clics en el dominio compartido. */
export const POST = authed(async (_req, user) => {
  if (!(await getAccount(user.id)).is_admin) return fail("No tienes permiso.", 403);
  const r = await enablePlatformTracking();
  if (!r.ok) return fail(r.error, 502);
  return json(r);
});
