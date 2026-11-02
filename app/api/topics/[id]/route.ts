import { body, guard } from "@/lib/api";
import { getWriter } from "@/lib/data";
import { run } from "@/lib/db";
import { parseTopic } from "@/lib/topics";
import { json, now } from "@/lib/util";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await guard(req);
  if (user instanceof Response) return user;
  const { id } = await ctx.params;

  const t = parseTopic(await body(req));
  if (typeof t === "string") return json({ error: t }, 400);
  if (!(await getWriter(user.id, t.writerId))) return json({ error: "Redactor no encontrado." }, 404);

  const n = await run(
    `UPDATE topics SET writer_id=?, title=?, notes=?, format=?, scheduled_day=?, send_hour=?, mode=?, status=?, error=NULL, updated_at=?
     WHERE id=? AND user_id=? AND status IN ('idea','scheduled','failed')`,
    [t.writerId, t.title, t.notes, t.format, t.day, t.hour, t.mode, t.day ? "scheduled" : "idea", now(), id, user.id],
  );
  if (n === 0) return json({ error: "Este tema ya no se puede editar." }, 409);
  return json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const user = await guard(req);
  if (user instanceof Response) return user;
  const { id } = await ctx.params;
  const n = await run("DELETE FROM topics WHERE id = ? AND user_id = ? AND status != 'running'", [id, user.id]);
  if (n === 0) return json({ error: "No encontrado." }, 404);
  return json({ ok: true });
}
