import { body, guard } from "@/lib/api";
import { getWriter } from "@/lib/data";
import { q1, run } from "@/lib/db";
import { MAX_TOPICS, parseTopic } from "@/lib/topics";
import { json, now, uid } from "@/lib/util";

export async function POST(req: Request) {
  const user = await guard(req);
  if (user instanceof Response) return user;

  const t = parseTopic(await body(req));
  if (typeof t === "string") return json({ error: t }, 400);
  if (!(await getWriter(user.id, t.writerId))) return json({ error: "Redactor no encontrado." }, 404);

  const count = await q1<{ n: number }>("SELECT COUNT(*) AS n FROM topics WHERE user_id = ?", [user.id]);
  if ((count?.n ?? 0) >= MAX_TOPICS) return json({ error: `Has llegado al máximo de ${MAX_TOPICS} temas. Quita alguno.` }, 403);

  const id = uid();
  await run(
    `INSERT INTO topics(id,user_id,writer_id,title,notes,format,scheduled_day,mode,status,created_at,updated_at)
     VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
    [id, user.id, t.writerId, t.title, t.notes, t.format, t.day, t.mode, t.day ? "scheduled" : "idea", now(), now()],
  );
  return json({ id });
}
