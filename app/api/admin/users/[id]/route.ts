import { getAccount } from "@/lib/data";
import { eq, isNull, update } from "@/lib/db";
import { authed, fail, json, readBody } from "@/lib/http";
import { isUuid } from "@/lib/util";

type P = { id: string };

/** Solo administradores: cambia el plan de un usuario (gratis / Premium). */
export const PATCH = authed<P>(async (req, user, { id }) => {
  if (!(await getAccount(user.id)).is_admin) return fail("No tienes permiso.", 403);
  if (!isUuid(id)) return fail("No encontrado.", 404);
  const b = await readBody(req);
  if (b.plan !== "free" && b.plan !== "pro") return fail("Plan no válido.");
  const rows = await update("users", { id: eq(id) }, { plan: b.plan });
  if (!rows.length) return fail("No encontrado.", 404);
  if (b.plan === "pro") await update("premium_requests", { user_id: eq(id), handled_at: isNull }, { handled_at: new Date().toISOString() });
  return json({ ok: true });
});
