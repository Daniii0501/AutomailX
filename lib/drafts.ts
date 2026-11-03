import "server-only";
import { aiEnabled, suspiciousNumbers, writeNewsletter } from "./ai";
import { insert } from "./db";
import type { FormatId } from "./formats";
import { lookOf, type WriterProfile } from "./newsletter";
import { FREE } from "./plans";
import { hit } from "./rate";

export type DraftResult = { ok: true; id: string; source: "ai" | "simulated" } | { ok: false; error: string; status: number };

/** Escribe un borrador con el redactor y lo guarda. Lo usan el panel, "Escribir ahora" y el cron. */
export async function createDraft(userId: string, writer: WriterProfile, brief: string, format: FormatId): Promise<DraftResult> {
  if (!(await hit(`ai:${userId}`, FREE.aiPerDay))) {
    return { ok: false, status: 429, error: `Has llegado al límite de ${FREE.aiPerDay} borradores de hoy. Mañana más.` };
  }
  const fmt = format === "auto" ? writer.format : format;
  const w = await writeNewsletter(brief, writer, fmt);

  const warnings: string[] = [];
  if (w.source === "simulated") {
    warnings.push(
      aiEnabled()
        ? `La IA ha fallado (${w.error ?? "error desconocido"}) y este borrador es un apaño automático. Prueba a escribirlo de nuevo.`
        : "Modo simulado: falta la clave de la IA (OPENAI_API_KEY o ANTHROPIC_API_KEY), así que este borrador solo reordena tus notas.",
    );
  } else {
    const sus = suspiciousNumbers(brief, w.newsletter);
    if (sus.length) warnings.push(`Revisa estas cifras: no aparecen en tus notas (${sus.join(", ")}).`);
  }

  const [row] = await insert<{ id: string }>("newsletters", {
    user_id: userId,
    writer_id: writer.id,
    look: lookOf(writer),
    brief,
    format: fmt,
    content: w.newsletter,
    warnings,
    source: w.source,
  });
  return { ok: true, id: row.id, source: w.source };
}
