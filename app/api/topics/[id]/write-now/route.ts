import { eq, one } from "@/lib/db";
import { authed, baseUrl, fail, json } from "@/lib/http";
import { runTopic, type Topic } from "@/lib/topics";
import { isUuid } from "@/lib/util";

export const maxDuration = 180;

type P = { id: string };

/** "Escribir ahora": genera el borrador al momento (nunca envía solo). */
export const POST = authed<P>(async (req, user, { id }) => {
  if (!isUuid(id)) return fail("No encontrado.", 404);
  const t = await one<Topic>("topics", { id: eq(id), user_id: eq(user.id) });
  if (!t) return fail("No encontrado.", 404);
  const r = await runTopic(t, user, baseUrl(req), { allowSend: false });
  if (!r.ok) return fail(r.error, r.retry ? 503 : 409);
  return json({ ok: true, newsletterId: r.newsletterId });
});
