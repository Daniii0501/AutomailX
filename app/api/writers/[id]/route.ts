import { body, guard } from "@/lib/api";
import { q1, run } from "@/lib/db";
import { json } from "@/lib/util";
import { parseWriter } from "@/lib/writers";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await guard(req);
  if (user instanceof Response) return user;
  const { id } = await ctx.params;

  const w = parseWriter(await body(req));
  if (typeof w === "string") return json({ error: w }, 400);

  const n = await run(
    "UPDATE writers SET animal=?, name=?, about=?, formality=?, length=?, emojis=?, sample=? WHERE id=? AND user_id=?",
    [w.animal, w.name, w.about, w.formality, w.length, w.emojis, w.sample, id, user.id],
  );
  if (n === 0) return json({ error: "No encontrado." }, 404);
  return json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const user = await guard(req);
  if (user instanceof Response) return user;
  const { id } = await ctx.params;

  const count = await q1<{ n: number }>("SELECT COUNT(*) AS n FROM writers WHERE user_id = ?", [user.id]);
  if ((count?.n ?? 0) <= 1) return json({ error: "Necesitas al menos un redactor." }, 400);

  const used = await q1<{ n: number }>(
    "SELECT COUNT(*) AS n FROM newsletters WHERE writer_id = ? AND user_id = ?",
    [id, user.id],
  );
  const n = await run("DELETE FROM writers WHERE id = ? AND user_id = ?", [id, user.id]);
  if (n === 0) return json({ error: "No encontrado." }, 404);
  // Los borradores del redactor eliminado se quedan sin autor: los borramos; los enviados se conservan en el historial.
  if ((used?.n ?? 0) > 0) {
    await run("DELETE FROM newsletters WHERE writer_id = ? AND user_id = ? AND status = 'draft'", [id, user.id]);
  }
  return json({ ok: true });
}
