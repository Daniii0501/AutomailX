import type { Look, Newsletter } from "./newsletter";
import { esc } from "./esc";

export type RenderCtx = { look: Look; senderName: string; publicationName: string; unsubscribeUrl: string; replyTo?: string; siteUrl: string };

export const SANS = "-apple-system,Segoe UI,Helvetica,Arial,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

export function renderNewsletter(n: Newsletter, c: RenderCtx): { html: string; text: string } {
  const accent = /^#[0-9a-f]{6}$/i.test(c.look.color) ? c.look.color : "#6d4aff";
  const sections = n.sections
    .map(
      (s) => `
      <tr><td style="padding:22px 36px 0 36px;">
        ${s.title ? `<div style="font:700 11px/1.2 ${SANS};letter-spacing:.14em;text-transform:uppercase;color:${accent};margin-bottom:8px;">${esc(s.title)}</div>` : ""}
        <div style="font:400 17px/1.65 ${SERIF};color:#1d1d1f;white-space:pre-line;">${esc(s.body)}</div>
      </td></tr>`,
    )
    .join("");

  const ctaHref = n.ctaUrl ?? (c.replyTo ? `mailto:${c.replyTo}` : "");
  const cta =
    n.cta && ctaHref
      ? `<tr><td style="padding:28px 36px 0 36px;"><a href="${esc(ctaHref)}" style="display:inline-block;background:#1d1d1f;color:#ffffff;text-decoration:none;font:600 15px/1 ${SANS};padding:14px 22px;border-radius:12px;">${esc(n.cta)}</a></td></tr>`
      : n.cta
        ? `<tr><td style="padding:28px 36px 0 36px;font:600 15px/1.4 ${SANS};color:#1d1d1f;">${esc(n.cta)}</td></tr>`
        : "";

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(n.subject)}</title></head>
<body style="margin:0;padding:0;background:#f4f2ef;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(n.preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f2ef;"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background:#ffffff;border-radius:20px;overflow:hidden;">
  <tr><td style="height:6px;background:${accent};font-size:0;line-height:0;">&nbsp;</td></tr>
  <tr><td style="padding:26px 36px 0 36px;font:600 13px/1.3 ${SANS};color:#6b6b76;">${esc(c.look.emoji)}&nbsp; ${esc(c.publicationName)}</td></tr>
  <tr><td style="padding:14px 36px 0 36px;font:700 22px/1.3 ${SERIF};color:#1d1d1f;">${esc(n.greeting)}</td></tr>
  ${sections}
  ${cta}
  <tr><td style="padding:30px 36px 34px 36px;font:italic 16px/1.5 ${SERIF};color:#55525c;">${esc(n.signoff)}<br><span style="font-style:normal;font-weight:700;color:#1d1d1f;">${esc(c.senderName)}</span></td></tr>
</table>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;"><tr><td align="center" style="padding:18px 20px 0 20px;font:400 12px/1.6 ${SANS};color:#8a8a93;">
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

