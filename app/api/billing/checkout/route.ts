import { getAccount } from "@/lib/data";
import { authed, baseUrl, fail, json } from "@/lib/http";
import { hit } from "@/lib/rate";
import { checkoutUrl, stripeEnabled, stripeMessage } from "@/lib/stripe";

/** Abre la página de pago de Stripe. */
export const POST = authed(async (req, user) => {
  if (!stripeEnabled()) return fail("El pago con tarjeta aún no está activado.", 503);
  if ((await getAccount(user.id)).plan === "pro") return fail("Ya tienes Premium.", 409);
  if (!(await hit(`checkout:${user.id}`, 20))) return fail("Demasiados intentos por hoy.", 429);
  try {
    return json({ url: await checkoutUrl(user, baseUrl(req)) });
  } catch (e) {
    console.error("[stripe] checkout", e);
    return fail(stripeMessage(e), 502);
  }
});
