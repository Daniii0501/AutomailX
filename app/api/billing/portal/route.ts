import { authed, baseUrl, fail, json } from "@/lib/http";
import { portalUrl, stripeEnabled, stripeMessage } from "@/lib/stripe";

/** Abre el portal de Stripe: facturas, cambiar tarjeta, cancelar. */
export const POST = authed(async (req, user) => {
  if (!stripeEnabled()) return fail("El pago con tarjeta aún no está activado.", 503);
  try {
    const url = await portalUrl(user.id, baseUrl(req));
    if (!url) return fail("No tienes ninguna suscripción con tarjeta.", 404);
    return json({ url });
  } catch (e) {
    console.error("[stripe] portal", e);
    return fail(stripeMessage(e), 502);
  }
});
