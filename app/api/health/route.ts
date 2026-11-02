import { aiEnabled } from "@/lib/ai";
import { dbConfigured, select } from "@/lib/db";
import { mailEnabled, usingTestSender } from "@/lib/email";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Diagnóstico rápido: qué está conectado. No muestra ningún secreto. */
export async function GET() {
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
  return json({
    ok: db === "ok",
    db,
    dbMs: Date.now() - t0,
    ai: aiEnabled() ? "ok" : "falta ANTHROPIC_API_KEY (modo simulado)",
    mail: mailEnabled() ? (usingTestSender() ? "ok (remitente de pruebas: solo a tu propio correo)" : "ok") : "falta RESEND_API_KEY",
    cron: process.env.CRON_SECRET ? "ok" : "falta CRON_SECRET",
    demoLogin: process.env.ALLOW_DEMO_LOGIN === "1" ? "ACTIVADA (quítala antes de abrir la web al público)" : "desactivada",
    node: process.version,
  });
}
