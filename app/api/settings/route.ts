import { eq, update } from "@/lib/db";
import { authed, fail, json, readBody } from "@/lib/http";
import { clean, isEmail, normEmail } from "@/lib/util";

export const PATCH = authed(async (req, user) => {
  const b = await readBody(req);
  const name = clean(b.name, 80);
  const sender = clean(b.senderName, 60).replace(/["<>]/g, "");
  if (name.length < 2) return fail("Ponle nombre a tu newsletter.");
  if (sender.length < 2) return fail("Pon el nombre que verán como remitente.");
  const replyTo = normEmail(b.replyTo);
  if (replyTo && !isEmail(replyTo)) return fail("El correo de respuesta no es válido.");
  const day = b.cadenceDay === "" || b.cadenceDay === null || b.cadenceDay === undefined ? null : Number(b.cadenceDay);
  if (day !== null && !(Number.isInteger(day) && day >= 0 && day <= 6)) return fail("Día no válido.");
  await update("publications", { user_id: eq(user.id) }, { name, sender_name: sender, reply_to: replyTo || null, cadence_day: day });
  return json({ ok: true });
});
