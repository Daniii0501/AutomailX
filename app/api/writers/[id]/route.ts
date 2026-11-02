import { parseWriter } from "@/lib/data";
import { eq, remove, update } from "@/lib/db";
import { authed, fail, json, readBody } from "@/lib/http";
import { isUuid } from "@/lib/util";

type P = { id: string };

export const PATCH = authed<P>(async (req, user, { id }) => {
  if (!isUuid(id)) return fail("No encontrado.", 404);
  const w = parseWriter(await readBody(req));
  if (typeof w === "string") return fail(w);
  const rows = await update("writers", { id: eq(id), user_id: eq(user.id) }, { ...w, updated_at: new Date().toISOString() });
  if (!rows.length) return fail("No encontrado.", 404);
  return json({ ok: true });
});

export const DELETE = authed<P>(async (_req, user, { id }) => {
  if (!isUuid(id)) return fail("No encontrado.", 404);
  const n = await remove("writers", { id: eq(id), user_id: eq(user.id) });
  if (!n) return fail("No encontrado.", 404);
  return json({ ok: true });
});
