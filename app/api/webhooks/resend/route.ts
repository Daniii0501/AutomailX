import { rpc } from "@/lib/db";
import { fail, json, open } from "@/lib/http";
import { verifySvix } from "@/lib/webhook";

const TRACKED = new Set(["email.delivered", "email.delivery_delayed", "email.opened", "email.clicked", "email.bounced", "email.complained"]);

type Event = {
  type?: string;
  created_at?: string;
  data?: { email_id?: string; created_at?: string; click?: { link?: string; timestamp?: string }; bounce?: { type?: string } };
};

/**
 * Avisos de Resend (entregas, aperturas, clics, rebotes y quejas) para las estadísticas.
 * En Resend > Webhooks se apunta a https://TU-WEB/api/webhooks/resend y su secreto va en RESEND_WEBHOOK_SECRET.
 */
export const POST = open(async (req) => {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return fail("Falta RESEND_WEBHOOK_SECRET.", 503);
  const raw = await req.text();
  if (!verifySvix(secret, req.headers, raw)) return fail("Firma no válida.", 401);

  let ev: Event;
  try {
    ev = JSON.parse(raw) as Event;
  } catch {
    return fail("Cuerpo no válido.", 400);
  }
  const id = ev.data?.email_id;
  if (!ev.type || !TRACKED.has(ev.type) || !id) return json({ ok: true, ignored: true });

  const at = ev.data?.click?.timestamp ?? ev.created_at ?? ev.data?.created_at ?? new Date().toISOString();
  const link = ev.type === "email.clicked" ? (ev.data?.click?.link ?? null) : null;
  const hard = ev.type === "email.bounced" && /permanent/i.test(ev.data?.bounce?.type ?? "");
  const known = await rpc<boolean>("amx_track", { p_id: id, p_type: ev.type, p_at: at, p_link: link, p_hard: hard });
  // 200 también si el correo no es una newsletter (p. ej. un enlace de acceso): así Resend no reintenta.
  return json({ ok: true, tracked: known === true });
});
