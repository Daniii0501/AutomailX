import { body } from "@/lib/api";
import { q1, run } from "@/lib/db";
import { mailEnabled, sendMail, simpleMail } from "@/lib/email";
import { FREE } from "@/lib/plans";
import { hit } from "@/lib/rate";
import { baseUrl, clean, ipHash, isEmail, json, newToken, normEmail, now, sameOrigin, uid } from "@/lib/util";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Petición no permitida." }, 403);
  if (!(await hit(`sub:${ipHash(req)}`, 20))) return json({ error: "Demasiados intentos. Prueba más tarde." }, 429);

  const b = await body<{ slug?: string; email?: string; name?: string; hp?: string }>(req);
  if (b.hp) return json({ ok: true, needsConfirm: true }); // trampa para bots
  const email = normEmail(String(b.email ?? ""));
  if (!isEmail(email)) return json({ error: "Escribe un correo válido." }, 400);
  // evita usar el formulario para bombardear a una persona con correos de confirmación
  if (!(await hit(`subemail:${email}`, 3))) return json({ ok: true, needsConfirm: true });

  const pub = await q1<{ user_id: string; name: string; sender_name: string; reply_to: string | null }>(
    "SELECT user_id, name, sender_name, reply_to FROM publications WHERE slug = ?",
    [String(b.slug ?? "")],
  );
  if (!pub) return json({ error: "Newsletter no encontrada." }, 404);

  const total = await q1<{ n: number }>(
    "SELECT COUNT(*) AS n FROM subscribers WHERE user_id = ? AND status != 'unsubscribed'",
    [pub.user_id],
  );
  const existing = await q1<{ id: string; status: string; token: string }>(
    "SELECT id, status, token FROM subscribers WHERE user_id = ? AND email = ?",
    [pub.user_id, email],
  );
  if (existing?.status === "confirmed") return json({ ok: true, needsConfirm: false });
  if (!existing && (total?.n ?? 0) >= FREE.subscribers) {
    return json({ error: "Esta newsletter no admite más suscriptores ahora mismo." }, 409);
  }

  const demo = !mailEnabled();
  const status = demo ? "confirmed" : "pending";
  let token = existing?.token;
  if (existing) {
    await run("UPDATE subscribers SET status = ?, name = ? WHERE id = ?", [status, clean(b.name, 80), existing.id]);
  } else {
    token = newToken();
    await run(
      "INSERT INTO subscribers(id,user_id,email,name,status,token,source,created_at) VALUES(?,?,?,?,?,?,'form',?)",
      [uid(), pub.user_id, email, clean(b.name, 80), status, token, now()],
    );
  }
  if (demo) return json({ ok: true, needsConfirm: false, demo: true });

  const link = `${await baseUrl()}/c/${token}`;
  const m = simpleMail({
    heading: `Confirma tu suscripción a ${pub.name}`,
    body: "Pulsa el botón para confirmar que quieres recibir esta newsletter. Si no has sido tú, ignora este correo y no pasará nada.",
    buttonText: "Confirmar suscripción",
    buttonUrl: link,
  });
  await sendMail({
    to: email,
    subject: `Confirma tu suscripción a ${pub.name}`,
    ...m,
    fromName: pub.sender_name,
    replyTo: pub.reply_to ?? undefined,
  });
  return json({ ok: true, needsConfirm: true });
}
