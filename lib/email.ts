import "server-only";
import { esc } from "./esc";
import { SANS } from "./render";

export { renderNewsletter } from "./render";

const FROM = () => process.env.MAIL_FROM || "AutoMailX <onboarding@resend.dev>";
export const mailEnabled = () => !!process.env.RESEND_API_KEY;
/** Con el remitente de pruebas de Resend solo se puede escribir al dueño de la cuenta de Resend. */
export const usingTestSender = () => FROM().includes("resend.dev");

const fromAddress = () => FROM().match(/<([^>]+)>/)?.[1] ?? FROM();
function fromWith(name: string): string {
  const safe = name.replace(/["<>\r\n]/g, "").trim().slice(0, 60) || "AutoMailX";
  return `${safe} <${fromAddress()}>`;
}

export type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  fromName?: string;
  replyTo?: string;
  headers?: Record<string, string>;
};

export type SendResult = { ok: boolean; demo: boolean; sent: number; error?: string };

const payload = (m: Mail) => ({
  from: m.fromName ? fromWith(m.fromName) : FROM(),
  to: [m.to],
  subject: m.subject,
  html: m.html,
  text: m.text,
  ...(m.replyTo ? { reply_to: m.replyTo } : {}),
  ...(m.headers ? { headers: m.headers } : {}),
});

function friendly(status: number, body: string): string {
  if (status === 403 && /testing emails|verify a domain/i.test(body))
    return "Resend solo deja escribir a tu propio correo hasta que verifiques un dominio (Resend > Domains).";
  if (status === 401 || status === 403) return "La clave de Resend no es válida.";
  if (status === 422) return `Resend ha rechazado el correo: ${body.slice(0, 160)}`;
  if (status === 429) return "Resend dice que vamos demasiado rápido. Prueba en un minuto.";
  return `Resend ${status}: ${body.slice(0, 160)}`;
}

async function post(path: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`https://api.resend.com${path}`, {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    if (res.ok) return { ok: true };
    return { ok: false, error: friendly(res.status, await res.text()) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de red" };
  }
}

export async function sendMail(m: Mail): Promise<SendResult> {
  if (!mailEnabled()) return { ok: true, demo: true, sent: 0 };
  const r = await post("/emails", payload(m));
  return { ok: r.ok, demo: false, sent: r.ok ? 1 : 0, error: r.error };
}

/** Envía en lotes de 100 (límite de Resend). */
export async function sendBatch(mails: Mail[]): Promise<SendResult> {
  if (!mailEnabled()) return { ok: true, demo: true, sent: 0 };
  let sent = 0;
  for (let i = 0; i < mails.length; i += 100) {
    const chunk = mails.slice(i, i + 100);
    const r = await post("/emails/batch", chunk.map(payload));
    if (!r.ok) return { ok: false, demo: false, sent, error: r.error };
    sent += chunk.length;
  }
  return { ok: true, demo: false, sent };
}

/** Correos sencillos de la app (enlace de acceso, confirmación, avisos). */
export function simpleMail(opts: { heading: string; body: string; buttonText: string; buttonUrl: string; foot?: string }) {
  const foot = opts.foot ?? "Si no has sido tú, ignora este correo.";
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#f4f2ef;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#fff;border-radius:20px;">
<tr><td style="padding:34px 32px;font:400 16px/1.6 ${SANS};color:#1d1d1f;">
<div style="font:700 22px/1.3 ${SANS};margin-bottom:10px;">${esc(opts.heading)}</div>
<div style="color:#55525c;">${esc(opts.body)}</div>
<div style="margin:26px 0 8px;"><a href="${esc(opts.buttonUrl)}" style="display:inline-block;background:#1d1d1f;color:#fff;text-decoration:none;font-weight:600;padding:14px 22px;border-radius:12px;">${esc(opts.buttonText)}</a></div>
<div style="font-size:12px;color:#8a8a93;margin-top:22px;">${esc(foot)}</div>
</td></tr></table></td></tr></table></body></html>`;
  const text = `${opts.heading}\n\n${opts.body}\n\n${opts.buttonText}: ${opts.buttonUrl}\n\n${foot}`;
  return { html, text };
}
