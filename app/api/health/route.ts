import { demoLogin } from "@/lib/auth";
import { aiEnabled } from "@/lib/ai";
import { db, isDemoDb } from "@/lib/db";
import { mailEnabled } from "@/lib/email";

export const dynamic = "force-dynamic";

/** Diagnóstico rápido: ¿funciona la base de datos y qué está configurado? (sin datos secretos) */
export async function GET() {
  let dbStatus = "ok";
  try {
    const c = await db();
    await c.execute("SELECT 1");
  } catch (e) {
    dbStatus = "ERROR: " + (e instanceof Error ? e.message : "desconocido").slice(0, 200);
  }
  return Response.json({
    base_de_datos: dbStatus,
    modo_base_de_datos: isDemoDb ? "demo (temporal, se puede borrar)" : "real (Turso)",
    entrada_directa_demo: demoLogin,
    correo_configurado: mailEnabled(),
    ia_configurada: aiEnabled(),
    node: process.version,
  });
}
