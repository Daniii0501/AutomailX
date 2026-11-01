import { body, guard } from "@/lib/api";
import { q1, run } from "@/lib/db";
import { clean, isEmail, json, normEmail } from "@/lib/util";

export async function PATCH(req: Request) {
  const user = await guard(req);
  if (user instanceof Response) return user;

  const b = await body<Record<string, unknown>>(req);
  const name = clean(b.name, 60);
  const sender = clean(b.sender_name, 60);
  const slug = clean(b.slug, 40).toLowerCase();
  const replyRaw = normEmail(clean(b.reply_to, 254));
  const cadence = b.cadence_day === null || b.cadence_day === "" ? null : Number(b.cadence_day);

  if (name.length < 2) return json({ error: "Ponle un nombre a tu newsletter." }, 400);
  if (sender.length < 2) return json({ error: "Escribe cómo quieres que aparezca tu nombre al enviar." }, 400);
  if (!/^[a-z0-9][a-z0-9-]{2,39}$/.test(slug)) {
    return json({ error: "El enlace solo puede llevar letras, números y guiones (3 a 40 caracteres)." }, 400);
  }
  if (replyRaw && !isEmail(replyRaw)) return json({ error: "El correo de respuesta no es válido." }, 400);
  if (cadence !== null && !(Number.isInteger(cadence) && cadence >= 0 && cadence <= 6)) {
    return json({ error: "Día no válido." }, 400);
  }

  const taken = await q1("SELECT user_id FROM publications WHERE slug = ? AND user_id != ?", [slug, user.id]);
  if (taken) return json({ error: "Ese enlace ya está en uso. Prueba con otro." }, 409);

  await run(
    "UPDATE publications SET name=?, sender_name=?, slug=?, reply_to=?, cadence_day=? WHERE user_id=?",
    [name, sender, slug, replyRaw || null, cadence, user.id],
  );
  return json({ ok: true });
}
