import { body, guard } from "@/lib/api";
import { getNewsletter, getPublication, getWriter } from "@/lib/data";
import { q, run } from "@/lib/db";
import { renderNewsletter, sendBatch, sendMail, type Mail } from "@/lib/email";
import { FREE } from "@/lib/plans";
import { hit } from "@/lib/rate";
import { baseUrl, json, now } from "@/lib/util";

export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const user = await guard(req);
  if (user instanceof Response) return user;
  const { id } = await ctx.params;

  const mode = (await body<{ mode?: string }>(req)).mode === "test" ? "test" : "all";
  const n = await getNewsletter(user.id, id);
  if (!n) return json({ error: "No encontrada." }, 404);
  const writer = await getWriter(user.id, n.writer_id);
  if (!writer) return json({ error: "El redactor ya no existe." }, 404);
  const pub = await getPublication(user.id);
  const base = await baseUrl();

  const common = {
    animal: writer.animal,
    senderName: pub.sender_name,
    publicationName: pub.name,
    replyTo: pub.reply_to ?? undefined,
    siteUrl: base,
  };

  // ---- Prueba: solo a ti ----
  if (mode === "test") {
    if (!(await hit(`test:${user.id}`, 15))) return json({ error: "Demasiadas pruebas hoy." }, 429);
    const { html, text } = renderNewsletter(n.content, { ...common, unsubscribeUrl: `${base}/u/preview` });
    const r = await sendMail({
      to: user.email,
      subject: `[Prueba] ${n.content.subject}`,
      html,
      text,
      fromName: pub.sender_name,
      replyTo: pub.reply_to ?? undefined,
    });
    if (!r.ok) return json({ error: r.error ?? "No se pudo enviar la prueba." }, 502);
    return json({ ok: true, demo: r.demo, to: user.email });
  }

  // ---- Envío real ----
  if (n.status !== "draft") return json({ error: "Esta newsletter ya está enviada o enviándose." }, 409);

  const subs = await q<{ email: string; token: string }>(
    "SELECT email, token FROM subscribers WHERE user_id = ? AND status = 'confirmed'",
    [user.id],
  );
  if (subs.length === 0) return json({ error: "Aún no tienes suscriptores confirmados." }, 400);
  if (!(await hit(`send:${user.id}`, FREE.sendsPerDay))) {
    return json({ error: "Has llegado al límite de envíos de hoy." }, 429);
  }

  // Reservamos el envío para que un doble clic no mande dos veces.
  const claimed = await run(
    "UPDATE newsletters SET status = 'sending', updated_at = ? WHERE id = ? AND user_id = ? AND status = 'draft'",
    [now(), id, user.id],
  );
  if (claimed !== 1) return json({ error: "Ya se está enviando." }, 409);

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
    await run("UPDATE newsletters SET status = 'draft', updated_at = ? WHERE id = ? AND user_id = ?", [now(), id, user.id]);
    return json({ error: r.error ?? "No se pudo enviar." }, 502);
  }

  await run(
    "UPDATE newsletters SET status = 'sent', recipients = ?, delivery = ?, sent_at = ?, updated_at = ? WHERE id = ? AND user_id = ?",
    [r.sent, r.demo ? "demo" : "resend", now(), now(), id, user.id],
  );
  return json({ ok: true, demo: r.demo, sent: r.sent, partial: !r.ok ? r.error : undefined });
}
