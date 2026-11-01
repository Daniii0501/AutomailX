import { body, guard } from "@/lib/api";
import { writeNewsletter } from "@/lib/ai";
import { getWriter } from "@/lib/data";
import { run } from "@/lib/db";
import { FREE } from "@/lib/plans";
import { hit } from "@/lib/rate";
import { clean, json, now, uid } from "@/lib/util";

export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await guard(req);
  if (user instanceof Response) return user;

  const b = await body<{ writerId?: string; brief?: string }>(req);
  const brief = clean(b.brief, 4000);
  if (brief.length < 15) return json({ error: "Cuéntame un poco más (mínimo una frase)." }, 400);

  const writer = await getWriter(user.id, String(b.writerId ?? ""));
  if (!writer) return json({ error: "Redactor no encontrado." }, 404);

  if (!(await hit(`ai:${user.id}`, FREE.aiPerDay))) {
    return json({ error: "Has llegado al límite de borradores de hoy. Vuelve mañana." }, 429);
  }

  const { newsletter, source } = await writeNewsletter(brief, writer);
  const id = uid();
  await run(
    "INSERT INTO newsletters(id,user_id,writer_id,brief,content,status,source,created_at,updated_at) VALUES(?,?,?,?,?,'draft',?,?,?)",
    [id, user.id, writer.id, brief, JSON.stringify(newsletter), source, now(), now()],
  );
  return json({ id, source });
}
