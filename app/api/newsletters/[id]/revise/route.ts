import { body, guard } from "@/lib/api";
import { reviseNewsletter } from "@/lib/ai";
import { getNewsletter, getWriter } from "@/lib/data";
import { run } from "@/lib/db";
import { isFormat } from "@/lib/formats";
import { FREE } from "@/lib/plans";
import { hit } from "@/lib/rate";
import { clean, json, now } from "@/lib/util";

export const maxDuration = 120;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const user = await guard(req);
  if (user instanceof Response) return user;
  const { id } = await ctx.params;

  const n = await getNewsletter(user.id, id);
  if (!n) return json({ error: "No encontrada." }, 404);
  if (n.status !== "draft") return json({ error: "Esta newsletter ya está enviada." }, 409);

  const instruction = clean((await body<{ instruction?: string }>(req)).instruction, 500);
  if (instruction.length < 3) return json({ error: "Dime qué quieres cambiar." }, 400);

  const writer = await getWriter(user.id, n.writer_id);
  if (!writer) return json({ error: "El redactor ya no existe." }, 404);

  if (!(await hit(`ai:${user.id}`, FREE.aiPerDay))) {
    return json({ error: "Has llegado al límite de cambios de hoy. Vuelve mañana." }, 429);
  }

  const { newsletter, source } = await reviseNewsletter(
    n.content,
    instruction,
    { ...writer, format: isFormat(n.format) ? n.format : writer.format },
    n.brief,
  );
  await run("UPDATE newsletters SET content = ?, source = ?, updated_at = ? WHERE id = ? AND user_id = ? AND status = 'draft'", [
    JSON.stringify(newsletter),
    source,
    now(),
    id,
    user.id,
  ]);
  return json({ content: newsletter, source });
}
