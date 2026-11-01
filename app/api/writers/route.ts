import { body, guard } from "@/lib/api";
import { q1, run } from "@/lib/db";
import { FREE } from "@/lib/plans";
import { json, now, uid } from "@/lib/util";
import { parseWriter } from "@/lib/writers";

export async function POST(req: Request) {
  const user = await guard(req);
  if (user instanceof Response) return user;

  const w = parseWriter(await body(req));
  if (typeof w === "string") return json({ error: w }, 400);

  const count = await q1<{ n: number }>("SELECT COUNT(*) AS n FROM writers WHERE user_id = ?", [user.id]);
  if ((count?.n ?? 0) >= FREE.writers) {
    return json({ error: `En el plan gratuito puedes tener hasta ${FREE.writers} redactores.` }, 403);
  }
  const id = uid();
  await run(
    "INSERT INTO writers(id,user_id,animal,name,about,formality,length,emojis,sample,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)",
    [id, user.id, w.animal, w.name, w.about, w.formality, w.length, w.emojis, w.sample, now()],
  );
  return json({ id });
}
