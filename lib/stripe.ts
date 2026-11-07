import "server-only";
import Stripe from "stripe";
import { eq, isNull, one, update } from "./db";
import { PRICE_CENTS } from "./plans";

/**
 * Cobro de Premium con Stripe.
 * - El producto y el precio se crean solos la primera vez (se buscan por `lookup_key`; si cambias
 *   el precio en lib/plans.ts, se crea uno nuevo y los clientes antiguos siguen con el suyo).
 * - Al pagar, Stripe avisa a /api/webhooks/stripe y el usuario pasa a Premium; si cancela o deja de
 *   pagar, vuelve a gratis.
 */

export const stripeEnabled = () => !!process.env.STRIPE_SECRET_KEY;
export const stripeTestMode = () => (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_");

let _stripe: Stripe | null = null;
export function stripe(): Stripe {
  if (!_stripe) {
    // STRIPE_API_URL solo para pruebas en local (simulador): "http://localhost:4005".
    const local = process.env.STRIPE_API_URL ? new URL(process.env.STRIPE_API_URL) : null;
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
      maxNetworkRetries: 1,
      timeout: 20_000,
      appInfo: { name: "AutoMailX" },
      ...(local ? { host: local.hostname, port: local.port, protocol: local.protocol.replace(":", "") as "http" | "https" } : {}),
    });
  }
  return _stripe;
}

const LOOKUP_KEY = `automailx_premium_monthly_${PRICE_CENTS}`;
const PORTAL_TAG = "automailx-v1";

/** Precio mensual de Premium (lo crea si no existe). */
async function premiumPriceId(): Promise<string> {
  const s = stripe();
  const found = await s.prices.list({ lookup_keys: [LOOKUP_KEY], active: true, limit: 1 });
  if (found.data[0]) return found.data[0].id;
  const product = await s.products.create({
    name: "AutoMailX Premium",
    description: "Newsletters sin límite y envío desde tu propio dominio.",
    metadata: { app: "automailx" },
  });
  const price = await s.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: PRICE_CENTS,
    recurring: { interval: "month" },
    tax_behavior: "inclusive",
    lookup_key: LOOKUP_KEY,
    nickname: "Premium mensual",
  });
  return price.id;
}

type BillingUser = { id: string; email: string; stripe_customer_id: string | null };

async function customerFor(user: { id: string; email: string }): Promise<string> {
  const row = await one<BillingUser>("users", { select: "id,email,stripe_customer_id", id: eq(user.id) });
  if (row?.stripe_customer_id) return row.stripe_customer_id;
  const c = await stripe().customers.create({ email: user.email, metadata: { user_id: user.id } });
  // Si dos peticiones llegan a la vez, nos quedamos con el primero que se guardó.
  const saved = await update<BillingUser>("users", { id: eq(user.id), stripe_customer_id: isNull }, { stripe_customer_id: c.id });
  if (saved.length) return c.id;
  const again = await one<BillingUser>("users", { select: "stripe_customer_id", id: eq(user.id) });
  return again?.stripe_customer_id ?? c.id;
}

/** Página de pago de Stripe para hacerse Premium. */
export async function checkoutUrl(user: { id: string; email: string }, base: string): Promise<string> {
  const [price, customer] = await Promise.all([premiumPriceId(), customerFor(user)]);
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: user.id,
    line_items: [{ price, quantity: 1 }],
    subscription_data: { metadata: { user_id: user.id } },
    allow_promotion_codes: true,
    locale: "es",
    success_url: `${base}/panel/premium?pagado=1`,
    cancel_url: `${base}/panel/premium`,
  });
  if (!session.url) throw new Error("Stripe no ha devuelto la página de pago.");
  return session.url;
}

/** Configuración del portal del cliente (facturas, tarjeta, cancelar). La crea si no existe. */
async function portalConfigId(): Promise<string> {
  const s = stripe();
  const list = await s.billingPortal.configurations.list({ active: true, limit: 20 });
  const mine = list.data.find((c) => c.metadata?.app === PORTAL_TAG);
  if (mine) return mine.id;
  const c = await s.billingPortal.configurations.create({
    business_profile: { headline: "Gestiona tu suscripción a AutoMailX Premium" },
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      customer_update: { enabled: true, allowed_updates: ["email", "address", "tax_id"] },
      subscription_cancel: { enabled: true, mode: "at_period_end", cancellation_reason: { enabled: true, options: ["too_expensive", "unused", "missing_features", "other"] } },
    },
    metadata: { app: PORTAL_TAG },
  });
  return c.id;
}

/** Portal de Stripe para que el cliente gestione su suscripción. */
export async function portalUrl(userId: string, base: string): Promise<string | null> {
  const row = await one<BillingUser>("users", { select: "stripe_customer_id", id: eq(userId) });
  if (!row?.stripe_customer_id) return null;
  const session = await stripe().billingPortal.sessions.create({
    customer: row.stripe_customer_id,
    configuration: await portalConfigId(),
    return_url: `${base}/panel/premium`,
    locale: "es",
  });
  return session.url;
}

// ---------------- Sincronizar con lo que dice Stripe ----------------

/** Estados en los que se mantiene Premium. past_due: Stripe está reintentando el cobro. */
const KEEPS_PRO = new Set(["active", "trialing", "past_due"]);

/** Guarda en el usuario el estado de su suscripción y le da o quita Premium. */
export async function syncSubscription(sub: Stripe.Subscription): Promise<{ userId: string; plan: "free" | "pro" } | null> {
  const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  let user = sub.metadata?.user_id ? await one<{ id: string }>("users", { select: "id", id: eq(sub.metadata.user_id) }) : null;
  if (!user) user = await one<{ id: string }>("users", { select: "id", stripe_customer_id: eq(customer) });
  if (!user) return null;

  const periodEnd = sub.items?.data?.[0]?.current_period_end;
  const plan = KEEPS_PRO.has(sub.status) ? "pro" : "free";
  await update("users", { id: eq(user.id) }, {
    plan,
    stripe_customer_id: customer,
    stripe_subscription_id: sub.id,
    subscription_status: sub.status,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end === true || !!sub.cancel_at,
  });
  if (plan === "pro") await update("premium_requests", { user_id: eq(user.id), handled_at: isNull }, { handled_at: new Date().toISOString() });
  return { userId: user.id, plan };
}

export type Billing = {
  status: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasCustomer: boolean;
};

export async function billingOf(userId: string): Promise<Billing> {
  const r = await one<{ subscription_status: string | null; current_period_end: string | null; cancel_at_period_end: boolean; stripe_customer_id: string | null }>(
    "users",
    { select: "subscription_status,current_period_end,cancel_at_period_end,stripe_customer_id", id: eq(userId) },
  );
  return {
    status: r?.subscription_status ?? null,
    periodEnd: r?.current_period_end ?? null,
    cancelAtPeriodEnd: r?.cancel_at_period_end === true,
    hasCustomer: !!r?.stripe_customer_id,
  };
}

export function stripeMessage(e: unknown): string {
  if (e instanceof Stripe.errors.StripeAuthenticationError) return "La clave de Stripe no es válida.";
  if (e instanceof Stripe.errors.StripePermissionError) return "La clave de Stripe no tiene permiso para esto.";
  if (e instanceof Stripe.errors.StripeConnectionError) return "No se pudo hablar con Stripe. Prueba en un momento.";
  if (e instanceof Stripe.errors.StripeError) return `Stripe: ${e.message}`;
  return "Algo ha fallado con el pago. Prueba otra vez.";
}
