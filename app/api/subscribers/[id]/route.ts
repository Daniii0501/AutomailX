import { getPublication } from "@/lib/data";
import { eq, one, remove, update } from "@/lib/db";
import { sendMail } from "@/lib/email";
import { authed, baseUrl, fail, json, readBody } from "@/lib/http";
import { hit } from "@/lib/rate";
import { confirmMail } from "@/lib/subscribers";
import { isUuid } from "@/lib/util";

type P = { id: string };

/** { action: "resend" } reenvía la confirmación; { action: "unsubscribe" } lo da de baja. */
export const PATCH = authed<P>(async (req, user, { id }) => {
  if (!isUuid(id)) return fail("No encontrado.", 404);
  const b = await readBody(req);
  const s = await one<{ email: string; token: string; status: string }>("subscribers", { id: eq(id), user_id: eq(user.id) });
  if (!s) return fail("No encontrado.", 404);

  if (b.action === "resend") {
    if (s.status !== "pending") return fail("Esta persona ya no está pendiente.");
    if (!(await hit(`resend:${user.id}`, 30))) return fail("Demasiados reenvíos por hoy.", 429);
    const pub = await getPublication(user.id);
    const r = await sendMail(confirmMail(s.email, s.token, pub.name, baseUrl(req)));
    if (!r.ok) return fail(r.error ?? "No se pudo reenviar.", 502);
    return json({ ok: true, demo: r.demo });
  }
  if (b.action === "unsubscribe") {
    await update("subscribers", { id: eq(id), user_id: eq(user.id) }, { status: "unsubscribed", unsubscribed_at: new Date().toISOString() });
    return json({ ok: true });
  }
  return fail("Acción no válida.");
});

export const DELETE = authed<P>(async (_req, user, { id }) => {
  if (!isUuid(id)) return fail("No encontrado.", 404);
  await remove("subscribers", { id: eq(id), user_id: eq(user.id) });
  return json({ ok: true });
});
