import { createDraft } from "./drafts";
import { getWriter } from "./data";
import { run } from "./db";
import { deliverNewsletter } from "./send";
import { topicBrief, type Topic } from "./topics";
import { now } from "./util";

type Who = { id: string; email: string };

export type RunResult =
  | { ok: true; newsletterId: string; sent?: number; note?: string }
  | { ok: false; error: string; retry: boolean };

const setStatus = (id: string, userId: string, status: string, error: string | null, newsletterId?: string) =>
  run("UPDATE topics SET status = ?, error = ?, newsletter_id = COALESCE(?, newsletter_id), updated_at = ? WHERE id = ? AND user_id = ?", [
    status,
    error,
    newsletterId ?? null,
    now(),
    id,
    userId,
  ]);

/**
 * Escribe el borrador de un tema (y lo envía si el tema pide envío automático y `allowSend`).
 * Lo usan tanto el botón "Escribir ahora" como el cron diario.
 */
export async function runTopic(t: Topic, user: Who, base: string, opts: { allowSend: boolean }): Promise<RunResult> {
  // Reservamos el tema: dos ejecuciones a la vez no pueden escribirlo dos veces.
  const claimed = await run(
    "UPDATE topics SET status = 'running', updated_at = ? WHERE id = ? AND user_id = ? AND status IN ('idea','scheduled','failed')",
    [now(), t.id, user.id],
  );
  if (claimed !== 1) return { ok: false, error: "Este tema ya se está escribiendo.", retry: false };

  const writer = await getWriter(user.id, t.writer_id);
  if (!writer) {
    await setStatus(t.id, user.id, "failed", "El redactor de este tema ya no existe.");
    return { ok: false, error: "El redactor de este tema ya no existe.", retry: false };
  }

  let draft;
  try {
    draft = await createDraft(user.id, writer, topicBrief(t), t.format);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error inesperado";
    await setStatus(t.id, user.id, t.status === "idea" ? "idea" : "scheduled", `No se pudo escribir: ${msg}`.slice(0, 200));
    return { ok: false, error: "No se pudo escribir el borrador.", retry: true };
  }
  if (!draft.ok) {
    await setStatus(t.id, user.id, t.status === "idea" ? "idea" : "scheduled", "Límite diario de borradores alcanzado: se reintentará.");
    return { ok: false, error: "Has llegado al límite de borradores de hoy.", retry: true };
  }

  if (opts.allowSend && t.mode === "send") {
    const r = await deliverNewsletter(user, draft.id, base);
    if (r.ok) {
      await setStatus(t.id, user.id, "sent", null, draft.id);
      return { ok: true, newsletterId: draft.id, sent: r.sent };
    }
    await setStatus(t.id, user.id, "drafted", `Borrador listo, pero no se envió: ${r.error}`.slice(0, 200), draft.id);
    return { ok: true, newsletterId: draft.id, note: `No se envió: ${r.error}` };
  }

  await setStatus(t.id, user.id, "drafted", null, draft.id);
  return { ok: true, newsletterId: draft.id };
}
