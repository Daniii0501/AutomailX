import { getAccount } from "@/lib/data";
import { eq, insert, select } from "@/lib/db";
import { sendBatch, simpleMail } from "@/lib/email";
import { authed, baseUrl, fail, json, readBody } from "@/lib/http";
import { PRICE } from "@/lib/plans";
import { hit } from "@/lib/rate";
import { clean } from "@/lib/util";

/** "Quiero Premium": se guarda la solicitud y se avisa por correo a los administradores. */
export const POST = authed(async (req, user) => {
  if ((await getAccount(user.id)).plan === "pro") return fail("Ya tienes Premium.", 409);
  if (!(await hit(`premium-req:${user.id}`, 3))) return fail("Ya nos lo has pedido hoy. Te escribiremos pronto.", 429);
  const b = await readBody(req);
  const billing = b.billing === "yearly" ? "yearly" : "monthly";
  await insert(
    "premium_requests",
    { user_id: user.id, billing, message: clean(b.message, 500), created_at: new Date().toISOString(), handled_at: null },
    { onConflict: "user_id", merge: true },
  );

  const admins = await select<{ email: string }>("users", { select: "email", is_admin: eq(true) });
  if (admins.length) {
    const price = billing === "yearly" ? `${PRICE.yearly} €/año` : `${PRICE.monthly} €/mes`;
    const m = simpleMail({
      heading: "Nueva solicitud de Premium",
      body: `${user.email} quiere Premium (${billing === "yearly" ? "anual" : "mensual"}, ${price}). Escríbele para cobrarlo y actívalo en Administración.`,
      buttonText: "Abrir Administración",
      buttonUrl: `${baseUrl(req)}/panel/admin`,
      foot: "Te llega porque eres administrador de AutoMailX.",
    });
    await sendBatch(admins.map((a) => ({ to: a.email, subject: `Premium: ${user.email}`, replyTo: user.email, ...m }))).catch(() => null);
  }
  return json({ ok: true });
});
