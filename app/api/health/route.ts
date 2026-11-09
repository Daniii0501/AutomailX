import { aiLabel } from "@/lib/ai";
import { stripe, stripeEnabled, stripeTestMode } from "@/lib/stripe";
import { count, dbConfigured, eq, inList, remove, rpc, select, update } from "@/lib/db";
import { mailEnabled, platformAddress, senderMisconfigured, usingTestSender } from "@/lib/email";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Prueba de ida y vuelta con cada tipo de operación (fila de prueba en `usage`, que se borra al final). */
async function deepCheck(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const key = "health:selftest";
  const run = async (name: string, fn: () => Promise<unknown>, ok: (v: unknown) => boolean) => {
    try {
      const v = await fn();
      out[name] = ok(v) ? "ok" : `inesperado: ${JSON.stringify(v)}`;
    } catch (e) {
      out[name] = `error: ${e instanceof Error ? e.message : String(e)}`;
    }
  };
  await run("rpc", () => rpc<boolean>("amx_hit", { p_key: key, p_limit: 1_000_000 }), (v) => v === true);
  await run("rpcCount", () => rpc<number>("amx_count", { p_key: key }), (v) => Number(v) >= 1);
  await run("count", () => count("usage", { key: eq(key) }), (v) => v === 1);
  await run("update", () => update("usage", { key: eq(key) }, { count: 0 }), (v) => Array.isArray(v) && v.length === 1);
  await run("selectIn", () => select("usage", { key: inList([key, "health:ninguna"]), order: "day.desc.nullslast" }), (v) => Array.isArray(v) && v.length === 1);
  await run("delete", () => remove("usage", { key: eq(key) }), (v) => v === 1);
  return out;
}

/** Diagnóstico rápido: qué está conectado. No muestra ningún secreto. */
export async function GET(req: Request) {
  const t0 = Date.now();
  let db: string = "sin configurar";
  if (dbConfigured()) {
    try {
      await select("publications", { select: "user_id", limit: 1 });
      db = "ok";
    } catch (e) {
      db = `error: ${e instanceof Error ? e.message : "desconocido"}`;
    }
  }
  const dbMs = Date.now() - t0;
  const deepOn = new URL(req.url).searchParams.get("deep") === "1";
  const deep = db === "ok" && deepOn ? await deepCheck() : undefined;
  let pay: string = stripeEnabled() ? (stripeTestMode() ? "ok (modo pruebas)" : "ok (cobros reales)") : "falta STRIPE_SECRET_KEY";
  if (stripeEnabled() && !process.env.STRIPE_WEBHOOK_SECRET) pay = "falta STRIPE_WEBHOOK_SECRET";
  if (stripeEnabled() && deepOn) {
    try {
      await stripe().balance.retrieve();
    } catch (e) {
      pay = `la clave de Stripe falla: ${e instanceof Error ? e.message.slice(0, 80) : "error"}`;
    }
  }
  return json({
    ok: db === "ok",
    db,
    dbMs,
    ...(deep ? { deep } : {}),
    ai: aiLabel() ? `ok: ${aiLabel()}` : "falta ANTHROPIC_API_KEY u OPENAI_API_KEY (modo simulado)",
    mail: !mailEnabled()
      ? "falta RESEND_API_KEY"
      : senderMisconfigured()
        ? "MAIL_FROM no tiene un correo válido (ejemplo: AutoMailX <hola@tudominio.com>)"
        : usingTestSender()
          ? "ok (remitente de pruebas: solo a tu propio correo)"
          : `ok (envía desde ${platformAddress()})`,
    payments: pay,
    stats: process.env.RESEND_WEBHOOK_SECRET ? "ok" : "falta RESEND_WEBHOOK_SECRET (sin aperturas ni clics)",
    cron: process.env.CRON_SECRET ? "ok" : "falta CRON_SECRET",
    demoLogin: process.env.ALLOW_DEMO_LOGIN === "1" ? "ACTIVADA (quítala antes de abrir la web al público)" : "desactivada",
    region: process.env.VERCEL_REGION ?? "local",
    node: process.version,
  });
}
