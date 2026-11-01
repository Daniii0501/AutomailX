import { demoLogin } from "@/lib/auth";
import { aiEnabled } from "@/lib/ai";
import { dbConfigured, q1 } from "@/lib/db";
import { mailEnabled } from "@/lib/email";

export const dynamic = "force-dynamic";

/** Diagnóstico rápido: ¿funciona la base de datos y qué está configurado? (sin datos secretos) */
export async function GET() {
  let dbStatus = "ok";
  if (!dbConfigured) {
    dbStatus = "SIN CONECTAR: falta DATABASE_URL (o POSTGRES_URL de la integración de Supabase)";
  } else {
    try {
      await q1("SELECT 1 AS ok");
    } catch (e) {
      dbStatus = "ERROR: " + (e instanceof Error ? e.message : "desconocido").slice(0, 200);
    }
  }
  return Response.json({
    base_de_datos: dbStatus,
    entrada_directa_de_pruebas: demoLogin,
    correo_configurado: mailEnabled(),
    ia_configurada: aiEnabled(),
    node: process.version,
  });
}
