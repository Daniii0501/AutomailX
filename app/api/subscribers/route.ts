import { body, guard } from "@/lib/api";
import { countSubscribers } from "@/lib/data";
import { q1, run } from "@/lib/db";
import { FREE } from "@/lib/plans";
import { clean, isEmail, json, newToken, normEmail, now, uid } from "@/lib/util";

export async function POST(req: Request) {
  const user = await guard(req);
  if (user instanceof Response) return user;

  const b = await body<{ emails?: string; name?: string; consent?: boolean }>(req);
  if (b.consent !== true) {
    return json({ error: "Confirma que tienes permiso de estas personas para escribirles." }, 400);
  }

  const parts = String(b.emails ?? "")
    .split(/[\s,;]+/)
    .map(normEmail)
    .filter(Boolean);
  const unique = [...new Set(parts)].slice(0, 2000);
  if (unique.length === 0) return json({ error: "Escribe al menos un correo." }, 400);

  const single = unique.length === 1 ? clean(b.name, 80) : "";
  let current = await countSubscribers(user.id);
  let added = 0;
  let skipped = 0;
  let invalid = 0;
  let overLimit = 0;

  for (const email of unique) {
    if (!isEmail(email)) {
      invalid++;
      continue;
    }
    const existing = await q1<{ status: string }>("SELECT status FROM subscribers WHERE user_id = ? AND email = ?", [
      user.id,
      email,
    ]);
    if (existing) {
      skipped++; // incluye a quien ya se dio de baja: se respeta su decisión
      continue;
    }
    if (current >= FREE.subscribers) {
      overLimit++;
      continue;
    }
    await run(
      "INSERT INTO subscribers(id,user_id,email,name,status,token,source,created_at) VALUES(?,?,?,?,'confirmed',?,?,?)",
      [uid(), user.id, email, single, newToken(), unique.length > 1 ? "import" : "manual", now()],
    );
    current++;
    added++;
  }
  return json({ added, skipped, invalid, overLimit, limit: FREE.subscribers });
}
