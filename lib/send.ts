import "server-only";
import { getNewsletter, getPublication } from "./data";
import { eq, insert, select, update } from "./db";
import { renderNewsletter, sendBatch, sendMail, type Mail } from "./email";
import { DEFAULT_LOOK } from "./newsletter";
import { FREE } from "./plans";
import { hit } from "./rate";

type Who = { id: string; email: string };

export type SendOutcome =
  | { ok: true; demo: boolean; sent: number; partial?: string }
  | { ok: false; status: number; error: string };

async function context(user: Who, newsletterId: string, base: string) {
  const n = await getNewsletter(user.id, newsletterId);
  if (!n) return null;
  const pub = await getPublication(user.id);
  const common = {
    look: n.look?.color ? n.look : DEFAULT_LOOK,
    senderName: pub.sender_name,
    publicationName: pub.name,
    replyTo: pub.reply_to ?? undefined,
    siteUrl: base,
  };
  return { n, pub, common };
}

/** HTML de vista previa (igual que el correo real). */
export async function previewHtml(user: Who, newsletterId: string, base: string): Promise<string | null> {
  const c = await context(user, newsletterId, base);
  if (!c) return null;
  return renderNewsletter(c.n.content, { ...c.common, unsubscribeUrl: `${base}/u/vista-previa` }).html;
}

/** Prueba: solo a tu correo. */
export async function sendTest(user: Who, newsletterId: string, base: string): Promise<SendOutcome> {
  const c = await context(user, newsletterId, base);
  if (!c) return { ok: false, status: 404, error: "No encontramos esta newsletter." };
  if (!(await hit(`test:${user.id}`, FREE.testsPerDay))) return { ok: false, status: 429, error: "Demasiadas pruebas por hoy." };
  const { html, text } = renderNewsletter(c.n.content, { ...c.common, unsubscribeUrl: `${base}/u/vista-previa` });
  const r = await sendMail({ to: user.email, subject: `[Prueba] ${c.n.content.subject}`, html, text, fromName: c.pub.sender_name, replyTo: c.pub.reply_to ?? undefined });
  if (!r.ok) return { ok: false, status: 502, error: r.error ?? "No se pudo enviar la prueba." };
  return { ok: true, demo: r.demo, sent: r.sent };
}

/** Envío real a todos los suscriptores confirmados. */
export async function deliverNewsletter(user: Who, newsletterId: string, base: string): Promise<SendOutcome> {
  const c = await context(user, newsletterId, base);
  if (!c) return { ok: false, status: 404, error: "No encontramos esta newsletter." };
  const { n, pub, common } = c;
  if (n.status !== "draft") return { ok: false, status: 409, error: "Esta newsletter ya está enviada o enviándose." };

  const subs = await select<{ id: string; email: string; token: string }>("subscribers", { select: "id,email,token", user_id: eq(user.id), status: eq("confirmed") });
  if (subs.length === 0) return { ok: false, status: 400, error: "Aún no tienes suscriptores confirmados. Añade alguno en Audiencia." };
  if (!(await hit(`send:${user.id}`, FREE.sendsPerDay))) return { ok: false, status: 429, error: `Has llegado al límite de ${FREE.sendsPerDay} envíos de hoy.` };

  // Reserva atómica: un doble clic (o un doble cron) no puede mandar dos veces.
  const claimed = await update("newsletters", { id: eq(newsletterId), user_id: eq(user.id), status: eq("draft") }, { status: "sending", updated_at: new Date().toISOString() });
  if (claimed.length !== 1) return { ok: false, status: 409, error: "Ya se está enviando." };

  const mails: Mail[] = subs.map((s) => {
    const unsub = `${base}/u/${s.token}?n=${newsletterId}`;
    const { html, text } = renderNewsletter(n.content, { ...common, unsubscribeUrl: unsub });
    return {
      to: s.email,
      subject: n.content.subject,
      html,
      text,
      fromName: pub.sender_name,
      replyTo: pub.reply_to ?? undefined,
      headers: {
        "List-Unsubscribe": `<${base}/api/public/unsubscribe?token=${s.token}&n=${newsletterId}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    };
  });

  const r = await sendBatch(mails);
  const now = new Date().toISOString();
  if (!r.ok && r.sent === 0) {
    await update("newsletters", { id: eq(newsletterId), user_id: eq(user.id) }, { status: "draft", updated_at: now });
    return { ok: false, status: 502, error: r.error ?? "No se pudo enviar." };
  }
  // Para las estadísticas: un registro por correo, con el id que nos da Resend.
  const rows = (r.ids ?? [])
    .map((id, i) => (id ? { id, user_id: user.id, newsletter_id: newsletterId, subscriber_id: subs[i].id, email: subs[i].email, sent_at: now } : null))
    .filter((x) => x !== null);
  for (let i = 0; i < rows.length; i += 500) {
    await insert("deliveries", rows.slice(i, i + 500), { onConflict: "id", ignoreDuplicates: true }).catch((e) => console.error("[send] deliveries", e));
  }
  await update(
    "newsletters",
    { id: eq(newsletterId), user_id: eq(user.id) },
    { status: "sent", recipients: r.demo ? subs.length : r.sent, delivery: r.demo ? "demo" : "resend", sent_at: now, updated_at: now },
  );
  return { ok: true, demo: r.demo, sent: r.demo ? subs.length : r.sent, partial: !r.ok ? r.error : undefined };
}
