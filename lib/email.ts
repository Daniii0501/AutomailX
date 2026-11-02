import type { Look } from "./look";
import type { Newsletter } from "./newsletter";
import { esc } from "./util";

const FROM = process.env.MAIL_FROM ?? "AutoMailX <onboarding@resend.dev>";
export const mailEnabled = () => !!process.env.RESEND_API_KEY;

function fromAddress(): string {
  return FROM.match(/<([^>]+)>/)?.[1] ?? FROM;
}

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

function payload(m: Mail) {
  return {
    from: m.fromName ? fromWith(m.fromName) : FROM,
    to: [m.to],
    subject: m.subject,
    html: m.html,
    text: m.text,
    ...(m.replyTo ? { reply_to: m.replyTo } : {}),
    ...(m.headers ? { headers: m.headers } : {}),
  };
}

async function post(path: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${process.env.RESEND_API_URL ?? "https://api.resend.com"}${path}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    if (res.ok) return { ok: true };
    const t = (await res.text()).slice(0, 300);
    return { ok: false, error: `Resend ${res.status}: ${t}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de red" };
  }
}

export async function sendMail(m: Mail): Promise<SendResult> {
  if (!mailEnabled()) return { ok: true, demo: true, sent: 1 };
  const r = await post("/emails", payload(m));
  return { ok: r.ok, demo: false, sent: r.ok ? 1 : 0, error: r.error };
}

/** Envía en lotes de 100 (límite de Resend). */
export async function sendBatch(mails: Mail[]): Promise<SendResult> {
  if (!mailEnabled()) return { ok: true, demo: true, sent: mails.length };
  let sent = 0;
  for (let i = 0; i < mails.length; i += 100) {
    const chunk = mails.slice(i, i + 100);
    const r = await post("/emails/batch", chunk.map(payload));
    if (!r.ok) return { ok: false, demo: false, sent, error: r.error };
    sent += chunk.length;
  }
  return { ok: true, demo: false, sent };
}

type Ctx = {
  look: Look;
  senderName: string;
  publicationName: string;
  unsubscribeUrl: string;
  replyTo?: string;
  siteUrl: string;
};

export function renderNewsletter(n: Newsletter, c: Ctx): { html: string; text: string } {
  const accent = c.look.color;
  const sections = n.sections
    .map(
      (s) => `
      <tr><td style="padding:22px 36px 0 36px;">
        ${s.title ? `<div style="font:700 11px/1.2 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:${accent};margin-bottom:6px;">${esc(s.title)}</div>` : ""}
        <div style="font:400 17px/1.65 Georgia,'Times New Roman',serif;color:#1d1d1f;white-space:pre-line;">${esc(s.body)}</div>
      </td></tr>`,
    )
    .join("");

  const ctaHref = n.ctaUrl ?? (c.replyTo ? `mailto:${c.replyTo}` : "");
  const cta =
    n.cta && ctaHref
      ? `<tr><td style="padding:28px 36px 0 36px;"><a href="${esc(ctaHref)}" style="display:inline-block;background:#1d1d1f;color:#ffffff;text-decoration:none;font:600 15px/1 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;padding:14px 22px;border-radius:12px;">${esc(n.cta)}</a></td></tr>`
      : n.cta
        ? `<tr><td style="padding:28px 36px 0 36px;font:600 15px/1.4 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1d1d1f;">${esc(n.cta)}</td></tr>`
        : "";

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(n.subject)}</title></head>
<body style="margin:0;padding:0;background:#f4f2ef;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(n.preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f2ef;"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background:#ffffff;border-radius:20px;overflow:hidden;">
  <tr><td style="height:6px;background:${accent};font-size:0;line-height:0;">&nbsp;</td></tr>
  <tr><td style="padding:26px 36px 0 36px;font:600 13px/1.3 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#6b6b76;">${esc(c.look.emoji)}&nbsp; ${esc(c.publicationName)}</td></tr>
  <tr><td style="padding:14px 36px 0 36px;font:700 22px/1.3 Georgia,'Times New Roman',serif;color:#1d1d1f;">${esc(n.greeting)}</td></tr>
  ${sections}
  ${cta}
  <tr><td style="padding:30px 36px 34px 36px;font:italic 16px/1.5 Georgia,'Times New Roman',serif;color:#55525c;">${esc(n.signoff)}<br><span style="font-style:normal;font-weight:700;color:#1d1d1f;">${esc(c.senderName)}</span></td></tr>
</table>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;"><tr><td align="center" style="padding:18px 20px 0 20px;font:400 12px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#8a8a93;">
  Recibes este correo porque te suscribiste a ${esc(c.publicationName)}.<br>
  <a href="${esc(c.unsubscribeUrl)}" style="color:#8a8a93;">Darme de baja</a> &middot;
  Escrito con <a href="${esc(c.siteUrl)}" style="color:#8a8a93;">AutoMailX</a>
</td></tr></table>
</td></tr></table></body></html>`;

  const text = [
    n.greeting,
    "",
    ...n.sections.flatMap((s) => [s.title ? s.title.toUpperCase() : "", s.body, ""]),
    n.cta && n.ctaUrl ? `${n.cta}: ${n.ctaUrl}` : n.cta,
    "",
    n.signoff,
    c.senderName,
    "",
    "—",
    `Recibes este correo porque te suscribiste a ${c.publicationName}.`,
    `Darme de baja: ${c.unsubscribeUrl}`,
  ].join("\n");

  return { html, text };
}

/** Correos transaccionales sencillos (enlace de acceso, confirmación, recordatorio). */
export function simpleMail(opts: { heading: string; body: string; buttonText: string; buttonUrl: string; foot?: string }): {
  html: string;
  text: string;
} {
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#f4f2ef;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#fff;border-radius:20px;">
<tr><td style="padding:34px 32px;font:400 16px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1d1d1f;">
<div style="font:700 22px/1.3 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;margin-bottom:10px;">${esc(opts.heading)}</div>
<div style="color:#55525c;">${esc(opts.body)}</div>
<div style="margin:26px 0 8px;"><a href="${esc(opts.buttonUrl)}" style="display:inline-block;background:#1d1d1f;color:#fff;text-decoration:none;font-weight:600;padding:14px 22px;border-radius:12px;">${esc(opts.buttonText)}</a></div>
<div style="font-size:12px;color:#8a8a93;margin-top:22px;">${esc(opts.foot ?? "Si no has sido tú, ignora este correo.")}</div>
</td></tr></table></td></tr></table></body></html>`;
  const text = `${opts.heading}\n\n${opts.body}\n\n${opts.buttonText}: ${opts.buttonUrl}\n\n${opts.foot ?? "Si no has sido tú, ignora este correo."}`;
  return { html, text };
}
