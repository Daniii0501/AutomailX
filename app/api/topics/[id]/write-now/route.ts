import { guard } from "@/lib/api";
import { q1 } from "@/lib/db";
import { runTopic } from "@/lib/topic-run";
import type { Topic } from "@/lib/topics";
import { baseUrl, json } from "@/lib/util";

export const maxDuration = 120;

type Ctx = { params: Promise<{ id: string }> };

/** "Escribir ahora": genera el borrador del tema al momento (nunca lo envía: lo revisas tú). */
export async function POST(req: Request, ctx: Ctx) {
  const user = await guard(req);
  if (user instanceof Response) return user;
  const { id } = await ctx.params;

  const t = await q1<Topic>("SELECT * FROM topics WHERE id = ? AND user_id = ?", [id, user.id]);
  if (!t) return json({ error: "No encontrado." }, 404);

  const r = await runTopic(t, user, await baseUrl(), { allowSend: false });
  if (!r.ok) return json({ error: r.error }, r.retry ? 429 : 409);
  return json({ newsletterId: r.newsletterId });
}
