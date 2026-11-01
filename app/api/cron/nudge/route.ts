import { q } from "@/lib/db";
import { mailEnabled, sendMail, simpleMail } from "@/lib/email";
import { hit } from "@/lib/rate";
import { baseUrl, json } from "@/lib/util";

/**
 * Recordatorio semanal: el día elegido, el redactor "te espera" por correo.
 * Vercel lo llama a diario (ver vercel.json) con `Authorization: Bearer CRON_SECRET`.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (req.headers.get("authorization") !== `Bearer ${secret}`) return json({ error: "No autorizado." }, 401);
  } else if (process.env.NODE_ENV === "production") {
    return json({ error: "Falta CRON_SECRET." }, 401);
  }
  if (!mailEnabled()) return json({ ok: true, skipped: "sin correo configurado" });

  const day = new Date().getUTCDay();
  const rows = await q<{ user_id: string; email: string; writer: string; pub: string }>(
    `SELECT p.user_id AS user_id, u.email AS email, p.name AS pub,
            (SELECT name FROM writers w WHERE w.user_id = p.user_id ORDER BY created_at LIMIT 1) AS writer
     FROM publications p JOIN users u ON u.id = p.user_id
     WHERE p.cadence_day = ?`,
    [day],
  );

  const base = await baseUrl();
  let sent = 0;
  for (const r of rows) {
    if (!r.writer) continue;
    if (!(await hit(`nudge:${r.user_id}`, 1))) continue;
    const m = simpleMail({
      heading: `${r.writer} te espera`,
      body: `Es el día de tu newsletter «${r.pub}». Cuéntale qué ha pasado esta semana y tendrás el borrador en un minuto.`,
      buttonText: "Contarle mi semana",
      buttonUrl: `${base}/panel`,
      foot: "Puedes cambiar o quitar este recordatorio en Ajustes.",
    });
    const res = await sendMail({ to: r.email, subject: `${r.writer} te espera para la newsletter de hoy`, ...m });
    if (res.ok) sent++;
  }
  return json({ ok: true, sent });
}
