import { cronGuard } from "@/lib/cron";
import { eq, inList, select } from "@/lib/db";
import { mailEnabled, sendBatch, simpleMail, type Mail } from "@/lib/email";
import { baseUrl, json, open } from "@/lib/http";

export const maxDuration = 120;

/** Recordatorio semanal: el día que eligió cada persona, un correo para que cuente su semana. */
export const GET = open(async (req) => {
  const denied = cronGuard(req);
  if (denied) return denied;
  if (!mailEnabled()) return json({ ok: true, sent: 0, note: "Sin RESEND_API_KEY" });

  const weekday = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" })).getDay();
  const pubs = await select<{ user_id: string; name: string }>("publications", { select: "user_id,name", cadence_day: eq(weekday), limit: 1000 });
  if (!pubs.length) return json({ ok: true, sent: 0 });
  const users = await select<{ id: string; email: string }>("users", { select: "id,email", id: inList(pubs.map((p) => p.user_id)) });
  const emailOf = new Map(users.map((u) => [u.id, u.email]));
  const base = baseUrl();

  const mails: Mail[] = pubs
    .filter((p) => emailOf.has(p.user_id))
    .map((p) => {
      const m = simpleMail({
        heading: "¿Qué tal la semana?",
        body: `Es el día de ${p.name}. Cuéntale a tu redactor lo que ha pasado (un par de frases bastan) y él se encarga del resto.`,
        buttonText: "Contar mi semana",
        buttonUrl: `${base}/panel`,
        foot: "Puedes cambiar o quitar este recordatorio en Ajustes.",
      });
      return { to: emailOf.get(p.user_id)!, subject: "¿Qué tal la semana? Tu redactor te espera", ...m };
    });
  const r = await sendBatch(mails);
  return json({ ok: r.ok, sent: r.sent, error: r.error });
});
