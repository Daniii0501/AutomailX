import { getNewsletter, parseContent } from "@/lib/data";
import { eq, remove, update } from "@/lib/db";
import { authed, fail, json, readBody } from "@/lib/http";
import { isUuid } from "@/lib/util";

type P = { id: string };

/** Guarda los cambios del editor. */
export const PATCH = authed<P>(async (req, user, { id }) => {
  const n = await getNewsletter(user.id, id);
  if (!n) return fail("No encontrada.", 404);
  if (n.status !== "draft") return fail("Esta newsletter ya se envió: no se puede cambiar.", 409);
  const b = await readBody(req);
  const content = parseContent(b.content);
  if (!content) return fail("Le falta el asunto o el texto.");
  await update("newsletters", { id: eq(id), user_id: eq(user.id), status: eq("draft") }, { content, updated_at: new Date().toISOString() });
  return json({ ok: true, content });
});

export const DELETE = authed<P>(async (_req, user, { id }) => {
  if (!isUuid(id)) return fail("No encontrada.", 404);
  const n = await remove("newsletters", { id: eq(id), user_id: eq(user.id), status: eq("draft") });
  if (!n) return fail("No se puede borrar (o ya no existe).", 404);
  return json({ ok: true });
});
