import { getWriter } from "@/lib/data";
import { eq, inList, remove, update } from "@/lib/db";
import { authed, fail, json, readBody } from "@/lib/http";
import { parseTopic } from "@/lib/topics";
import { isUuid } from "@/lib/util";

type P = { id: string };

export const PATCH = authed<P>(async (req, user, { id }) => {
  if (!isUuid(id)) return fail("No encontrado.", 404);
  const t = parseTopic(await readBody(req));
  if (typeof t === "string") return fail(t);
  if (!(await getWriter(user.id, t.writer_id))) return fail("Ese redactor no existe.");
  const rows = await update(
    "topics",
    { id: eq(id), user_id: eq(user.id), status: inList(["idea", "scheduled", "failed"]) },
    { ...t, status: t.scheduled_day ? "scheduled" : "idea", error: null, updated_at: new Date().toISOString() },
  );
  if (!rows.length) return fail("Este tema ya está escrito y no se puede cambiar.", 409);
  return json({ ok: true });
});

export const DELETE = authed<P>(async (_req, user, { id }) => {
  if (!isUuid(id)) return fail("No encontrado.", 404);
  await remove("topics", { id: eq(id), user_id: eq(user.id) });
  return json({ ok: true });
});
