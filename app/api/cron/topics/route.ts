import { q } from "@/lib/db";
import { mailEnabled, sendMail, simpleMail } from "@/lib/email";
import { runTopic } from "@/lib/topic-run";
import { madridToday, type Topic } from "@/lib/topics";
import { baseUrl, json } from "@/lib/util";

export const maxDuration = 300;

/**
 * Cron diario: escribe los temas cuyo día ha llegado (o ya pasó, si algún día falló).
 * Vercel lo llama con `Authorization: Bearer CRON_SECRET`.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (req.headers.get("authorization") !== `Bearer ${secret}`) return json({ error: "No autorizado." }, 401);
  } else if (process.env.NODE_ENV === "production") {
    return json({ error: "Falta CRON_SECRET." }, 401);
  }

  const started = Date.now();
  const due = await q<Topic & { email: string }>(
    `SELECT t.*, u.email AS email FROM topics t JOIN users u ON u.id = t.user_id
     WHERE t.status = 'scheduled' AND t.scheduled_day <= ?
     ORDER BY t.scheduled_day, t.created_at LIMIT 40`,
    [madridToday()],
  );

  const base = await baseUrl();
  let done = 0;
  let failed = 0;
  for (const t of due) {
    if (Date.now() - started > 230_000) break; // lo que no dé tiempo se hace en la siguiente ejecución
    const user = { id: t.user_id, email: t.email };
    const r = await runTopic(t, user, base, { allowSend: true });
    if (r.ok) done++;
    else failed++;

    if (mailEnabled() && (r.ok || !r.retry)) {
      const link = r.ok ? `${base}/panel/n/${r.newsletterId}` : `${base}/panel/temas`;
      const m = simpleMail({
        heading: r.ok ? (r.sent ? `Hemos enviado «${t.title}»` : `Tu borrador «${t.title}» está listo`) : `No hemos podido escribir «${t.title}»`,
        body: r.ok
          ? r.sent
            ? `Tu newsletter se ha enviado a ${r.sent} ${r.sent === 1 ? "persona" : "personas"}.`
            : `Tu redactor ya lo ha escrito. Échale un vistazo, ajusta lo que quieras y envíalo.${r.note ? ` (${r.note})` : ""}`
          : r.error,
        buttonText: r.ok ? "Abrir la newsletter" : "Ver mis temas",
        buttonUrl: link,
        foot: "Recibes este aviso porque programaste este tema en AutoMailX.",
      });
      await sendMail({ to: t.email, subject: r.ok ? (r.sent ? `Enviada: ${t.title}` : `Borrador listo: ${t.title}`) : `Problema con tu tema: ${t.title}`, ...m });
    }
  }
  return json({ ok: true, due: due.length, done, failed });
}
