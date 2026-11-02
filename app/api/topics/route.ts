import { getWriter } from "@/lib/data";
import { count, eq, insert } from "@/lib/db";
import { authed, fail, json, readBody } from "@/lib/http";
import { MAX_TOPICS, parseTopic } from "@/lib/topics";

export const POST = authed(async (req, user) => {
  if ((await count("topics", { user_id: eq(user.id) })) >= MAX_TOPICS) return fail("Tienes demasiados temas guardados. Borra alguno.", 403);
  const t = parseTopic(await readBody(req));
  if (typeof t === "string") return fail(t);
  if (!(await getWriter(user.id, t.writer_id))) return fail("Ese redactor no existe.");
  const [row] = await insert<{ id: string }>("topics", { ...t, user_id: user.id, status: t.scheduled_day ? "scheduled" : "idea" });
  return json({ ok: true, id: row.id });
});
