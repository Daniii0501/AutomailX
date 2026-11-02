import { getNewsletter, getPublication, getWriter } from "./data";
import { q, run } from "./db";
import { renderNewsletter, sendBatch, sendMail, type Mail } from "./email";
import { lookOf } from "./look";
import { FREE } from "./plans";
import { hit } from "./rate";
import { now } from "./util";

type Who = { id: string; email: string };

export type SendOutcome =
  | { ok: true; demo: boolean; sent: number; partial?: string }
  | { ok: false; status: number; error: string };

async function context(user: Who, newsletterId: string, base: string) {
  const n = await getNewsletter(user.id, newsletterId);
  if (!n) return { ok: false as const, status: 404, message: "No encontrada." };
  const writer = await getWriter(user.id, n.writer_id);
  if (!writer) return { ok: false as const, status: 404, message: "El redactor ya no existe." };
  const pub = await getPublication(user.id);
  const common = {
    look: lookOf(writer),
    senderName: pub.sender_name,
    publicationName: pub.name,
    replyTo: pub.reply_to ?? undefined,
    siteUrl: base,
  };
  return { ok: true as const, n, pub, common };
}

/** Prueba: solo a ti. */
export async function sendTest(user: Who, newsletterId: string, base: string) {
  const c = await context(user, newsletterId, base);
  if (!c.ok) return { ok: false as const, status: c.status, error: c.message };
  if (!(await hit(`test:${user.id}`, 15))) return { ok: false as const, status: 429, error: "Demasiadas pruebas hoy." };

  const { html, text } = renderNewsletter(c.n.content, { ...c.common, unsubscribeUrl: `${base}/u/preview` });
  const r = await sendMail({
    to: user.email,
    subject: `[Prueba] ${c.n.content.subject}`,
    html,
    text,
    fromName: c.pub.sender_name,
    replyTo: c.pub.reply_to ?? undefined,
  });
  if (!r.ok) return { ok: false as const, status: 502, error: r.error ?? "No se pudo enviar la prueba." };
  return { ok: true as const, demo: r.demo, to: user.email };
}

/** Envío real a todos los suscriptores confirmados. */
export async function deliverNewsletter(user: Who, newsletterId: string, base: string): Promise<SendOutcome> {
  const c = await context(user, newsletterId, base);
  if (!c.ok) return { ok: false, status: c.status, error: c.message };
  const { n, pub, common } = c;

  if (n.status !== "draft") return { ok: false, status: 409, error: "Esta newsletter ya está enviada o enviándose." };

  const subs = await q<{ email: string; token: string }>(
    "SELECT email, token FROM subscribers WHERE user_id = ? AND status = 'confirmed'",
    [user.id],
  );
  if (subs.length === 0) return { ok: false, status: 400, error: "Aún no tienes suscriptores confirmados." };
  if (!(await hit(`send:${user.id}`, FREE.sendsPerDay))) {
    return { ok: false, status: 429, error: "Has llegado al límite de envíos de hoy." };
  }

  // Reservamos el envío para que un doble clic (o un doble cron) no mande dos veces.
  const claimed = await run(
    "UPDATE newsletters SET status = 'sending', updated_at = ? WHERE id = ? AND user_id = ? AND status = 'draft'",
    [now(), newsletterId, user.id],
  );
  if (claimed !== 1) return { ok: false, status: 409, error: "Ya se está enviando." };

  const mails: Mail[] = subs.map((s) => {
    const unsub = `${base}/u/${s.token}`;
    const { html, text } = renderNewsletter(n.content, { ...common, unsubscribeUrl: unsub });
    return {
      to: s.email,
      subject: n.content.subject,
      html,
      text,
      fromName: pub.sender_name,
      replyTo: pub.reply_to ?? undefined,
      headers: {
        "List-Unsubscribe": `<${base}/api/public/unsubscribe?token=${s.token}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    };
  });

  const r = await sendBatch(mails);
  if (!r.ok && r.sent === 0) {
    await run("UPDATE newsletters SET status = 'draft', updated_at = ? WHERE id = ? AND user_id = ?", [now(), newsletterId, user.id]);
    return { ok: false, status: 502, error: r.error ?? "No se pudo enviar." };
  }

  await run(
    "UPDATE newsletters SET status = 'sent', recipients = ?, delivery = ?, sent_at = ?, updated_at = ? WHERE id = ? AND user_id = ?",
    [r.sent, r.demo ? "demo" : "resend", now(), now(), newsletterId, user.id],
  );
  return { ok: true, demo: r.demo, sent: r.sent, partial: !r.ok ? r.error : undefined };
}
