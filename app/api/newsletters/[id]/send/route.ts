import { body, guard } from "@/lib/api";
import { deliverNewsletter, sendTest } from "@/lib/send";
import { baseUrl, json } from "@/lib/util";

export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const user = await guard(req);
  if (user instanceof Response) return user;
  const { id } = await ctx.params;

  const mode = (await body<{ mode?: string }>(req)).mode === "test" ? "test" : "all";
  const base = await baseUrl();

  if (mode === "test") {
    const r = await sendTest(user, id, base);
    if (!r.ok) return json({ error: r.error }, r.status);
    return json({ ok: true, demo: r.demo, to: r.to });
  }

  const r = await deliverNewsletter(user, id, base);
  if (!r.ok) return json({ error: r.error }, r.status);
  return json({ ok: true, demo: r.demo, sent: r.sent, partial: r.partial });
}
