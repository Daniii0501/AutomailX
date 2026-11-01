import { body, guard } from "@/lib/api";
import { getNewsletter } from "@/lib/data";
import { run } from "@/lib/db";
import { sanitizeNewsletter } from "@/lib/newsletter";
import { json, now } from "@/lib/util";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await guard(req);
  if (user instanceof Response) return user;
  const { id } = await ctx.params;

  const n = await getNewsletter(user.id, id);
  if (!n) return json({ error: "No encontrada." }, 404);
  if (n.status !== "draft") return json({ error: "Esta newsletter ya está enviada." }, 409);

  const b = await body<{ content?: unknown }>(req);
  const content = sanitizeNewsletter(b.content);
  if (!content) return json({ error: "Contenido no válido." }, 400);

  await run("UPDATE newsletters SET content = ?, updated_at = ? WHERE id = ? AND user_id = ? AND status = 'draft'", [
    JSON.stringify(content),
    now(),
    id,
    user.id,
  ]);
  return json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const user = await guard(req);
  if (user instanceof Response) return user;
  const { id } = await ctx.params;
  const n = await run("DELETE FROM newsletters WHERE id = ? AND user_id = ? AND status = 'draft'", [id, user.id]);
  if (n === 0) return json({ error: "Solo se pueden borrar borradores." }, 404);
  return json({ ok: true });
}
