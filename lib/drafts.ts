import "server-only";
import { aiEnabled, suspiciousNumbers, writeNewsletter } from "./ai";
import { insert } from "./db";
import type { FormatId } from "./formats";
import { lookOf, type WriterProfile } from "./newsletter";
import { getAccount } from "./data";
import { FREE, limitsFor } from "./plans";
import { hitWeek } from "./rate";

/** `upsell`: el error es por el límite del plan gratis (la web ofrece Premium). */
export type DraftResult = { ok: true; id: string; source: "ai" | "simulated" } | { ok: false; error: string; status: number; upsell?: boolean };

/** Escribe un borrador con el redactor y lo guarda. Lo usan el panel, "Escribir ahora" y el cron. */
export async function createDraft(userId: string, writer: WriterProfile, brief: string, format: FormatId): Promise<DraftResult> {
  const { plan } = await getAccount(userId);
  if (!(await hitWeek(`write-week:${userId}`, limitsFor(plan).writesPerWeek))) {
    return plan === "pro"
      ? { ok: false, status: 429, error: "Has escrito muchísimas newsletters esta semana. El lunes se reinicia el contador." }
      : { ok: false, status: 429, upsell: true, error: `Has usado tus ${FREE.writesPerWeek} newsletters gratis de esta semana. Con Premium escribes sin límite (o espera al lunes).` };
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
