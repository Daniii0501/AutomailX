import type Stripe from "stripe";
import { eq, one } from "@/lib/db";
import { sendMail, simpleMail } from "@/lib/email";
import { baseUrl, fail, json, open } from "@/lib/http";
import { priceLabel } from "@/lib/plans";
import { stripe, syncSubscription } from "@/lib/stripe";

/**
 * Avisos de Stripe. En Stripe > Developers > Webhooks apunta a https://TU-WEB/api/webhooks/stripe con:
 * checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed.
 */
export const POST = open(async (req) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) return fail("Stripe no está configurado.", 503);
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return fail("Firma no válida.", 400);
  }

  const base = baseUrl(req);
  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object;
      if (s.mode === "subscription" && s.subscription) {
        const subId = typeof s.subscription === "string" ? s.subscription : s.subscription.id;
        const sub = await stripe().subscriptions.retrieve(subId);
        const r = await syncSubscription(sub);
        if (r?.plan === "pro") {
          const u = await one<{ email: string }>("users", { select: "email", id: eq(r.userId) });
          if (u) {
            const m = simpleMail({
              heading: "¡Bienvenido a Premium! ✨",
              body: `Ya tienes newsletters sin límite y puedes enviar desde tu propio dominio (configúralo en Ajustes). Tu suscripción es de ${priceLabel()} al mes y puedes cancelarla cuando quieras.`,
              buttonText: "Ir a mi panel",
              buttonUrl: `${base}/panel/premium`,
              foot: "Recibes este correo porque te has suscrito a AutoMailX Premium.",
            });
            await sendMail({ to: u.email, subject: "Ya eres Premium en AutoMailX", ...m });
          }
        }
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object);
      break;
    case "invoice.payment_failed": {
      const inv = event.data.object;
      const customer = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
      const u = customer ? await one<{ email: string }>("users", { select: "email", stripe_customer_id: eq(customer) }) : null;
      if (u) {
        const m = simpleMail({
          heading: "No hemos podido cobrar tu Premium",
          body: "Tu tarjeta ha rechazado el pago. Stripe lo volverá a intentar en unos días; para no perder Premium, revisa o cambia tu tarjeta.",
          buttonText: "Revisar mi tarjeta",
          buttonUrl: `${base}/panel/premium`,
          foot: "Recibes este correo porque tienes AutoMailX Premium.",
        });
        await sendMail({ to: u.email, subject: "Problema con el pago de tu Premium", ...m });
      }
      break;
    }
  }
  return json({ received: true });
});
