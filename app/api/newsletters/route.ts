import { body, guard } from "@/lib/api";
import { getWriter } from "@/lib/data";
import { createDraft } from "@/lib/drafts";
import { clean, json } from "@/lib/util";

export const maxDuration = 120;

export async function POST(req: Request) {
  const user = await guard(req);
  if (user instanceof Response) return user;

  const b = await body<{ writerId?: string; brief?: string; format?: string }>(req);
  const brief = clean(b.brief, 4000);
  if (brief.length < 15) return json({ error: "Cuéntame un poco más (mínimo una frase)." }, 400);

  const writer = await getWriter(user.id, String(b.writerId ?? ""));
  if (!writer) return json({ error: "Redactor no encontrado." }, 404);

  const r = await createDraft(user.id, writer, brief, b.format);
  if (!r.ok) return json({ error: "Has llegado al límite de borradores de hoy. Vuelve mañana." }, 429);
  return json({ id: r.id, source: r.source });
}
