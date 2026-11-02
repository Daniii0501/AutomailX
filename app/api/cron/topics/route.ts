import { cronGuard } from "@/lib/cron";
import { eq, isNull, lt, notNull, one, select, update } from "@/lib/db";
import { mailEnabled, sendMail, simpleMail } from "@/lib/email";
import { baseUrl, json, open } from "@/lib/http";
import { madridHour, madridToday, runTopic, type Topic } from "@/lib/topics";

export const maxDuration = 300;

/**
 * Escribe (y envía, si se pidió) los temas cuya fecha y hora de España ya han llegado.
 * En Vercel Hobby el cron es diario; para respetar la hora exacta, un servicio gratuito
 * (cron-job.org) puede llamar a esta dirección cada hora con la misma cabecera.
 */
export const GET = open(async (req) => {
  const denied = cronGuard(req);
  if (denied) return denied;

  const today = madridToday();
  const hour = madridHour();
  const [past, todays] = await Promise.all([
    select<Topic>("topics", { status: eq("scheduled"), scheduled_day: lt(today), order: "scheduled_day.asc", limit: 40 }),
    select<Topic>("topics", { status: eq("scheduled"), scheduled_day: eq(today), send_hour: `lte.${hour}`, order: "created_at.asc", limit: 40 }),
  ]);
  const due = [...past, ...todays].slice(0, 40);

  const base = baseUrl();
  const started = Date.now();
  let done = 0;
  let failed = 0;
  for (const t of due) {
    if (Date.now() - started > 230_000) break; // lo que no dé tiempo, en la siguiente pasada
    const user = await one<{ id: string; email: string }>("users", { select: "id,email", id: eq(t.user_id) });
    if (!user) continue;
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
      await sendMail({ to: user.email, subject: r.ok ? (r.sent ? `Enviada: ${t.title}` : `Borrador listo: ${t.title}`) : `Problema con tu tema: ${t.title}`, ...m });
    }
  }
  // Temas que se quedaron "escribiéndose" por un corte: vuelven a la cola.
  const stale = lt(new Date(Date.now() - 15 * 60_000).toISOString());
  await update("topics", { status: eq("running"), updated_at: stale, scheduled_day: notNull }, { status: "scheduled" });
  await update("topics", { status: eq("running"), updated_at: stale, scheduled_day: isNull }, { status: "idea" });
  return json({ ok: true, due: due.length, done, failed });
});
