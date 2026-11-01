import { guard } from "@/lib/api";
import { run } from "@/lib/db";
import { json } from "@/lib/util";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, ctx: Ctx) {
  const user = await guard(req);
  if (user instanceof Response) return user;
  const { id } = await ctx.params;
  const n = await run("DELETE FROM subscribers WHERE id = ? AND user_id = ?", [id, user.id]);
  if (n === 0) return json({ error: "No encontrado." }, 404);
  return json({ ok: true });
}
