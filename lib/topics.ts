import "server-only";
import { createDraft } from "./drafts";
import { getWriter } from "./data";
import { eq, inList, update } from "./db";
import { isFormat, type FormatId } from "./formats";
import { deliverNewsletter } from "./send";
import { clean, isUuid } from "./util";

export type TopicStatus = "idea" | "scheduled" | "running" | "drafted" | "sent" | "failed";

export type Topic = {
  id: string;
  user_id: string;
  writer_id: string | null;
  title: string;
  notes: string;
  format: FormatId;
  scheduled_day: string | null;
  send_hour: number;
  mode: "draft" | "send";
  status: TopicStatus;
  newsletter_id: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export const MAX_TOPICS = 200;

/** Hoy en España (YYYY-MM-DD). */
export const madridToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
/** Hora actual en España (0-23). */
export const madridHour = () =>
  Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", hour: "2-digit", hourCycle: "h23" }).format(new Date()));

export type TopicInput = { title: string; notes: string; writer_id: string; format: FormatId; scheduled_day: string | null; send_hour: number; mode: "draft" | "send" };

export function parseTopic(b: Record<string, unknown>): TopicInput | string {
  const title = clean(b.title, 120);
  if (title.length < 3) return "Ponle un título al tema.";
  const notes = clean(b.notes, 2000);
  if (title.length + notes.length < 15) return "Añade algo más de detalle: cuanto más le cuentes, mejor escribirá.";
  let day: string | null = null;
  if (typeof b.day === "string" && b.day) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.day) || Number.isNaN(Date.parse(b.day))) return "La fecha no es válida.";
    if (b.day < madridToday()) return "Elige hoy o un día futuro.";
    day = b.day;
  }
  const h = Number(b.hour ?? 8);
  if (!Number.isInteger(h) || h < 0 || h > 23) return "La hora no es válida.";
  if (!isUuid(b.writerId)) return "Elige un redactor.";
  return {
    title,
    notes,
    writer_id: b.writerId,
    format: isFormat(b.format) ? b.format : "auto",
    scheduled_day: day,
    send_hour: h,
    mode: b.mode === "send" ? "send" : "draft",
  };
}

export const topicBrief = (t: { title: string; notes: string }) => `Tema: ${t.title}${t.notes ? `\n\n${t.notes}` : ""}`;

export type RunResult = { ok: true; newsletterId: string; sent?: number; note?: string } | { ok: false; error: string; retry: boolean };

/** Escribe el borrador de un tema (y lo envía si el tema lo pide y `allowSend`). */
export async function runTopic(t: Topic, user: { id: string; email: string }, base: string, opts: { allowSend: boolean }): Promise<RunResult> {
  const now = () => new Date().toISOString();
  const set = (patch: Record<string, unknown>) => update("topics", { id: eq(t.id), user_id: eq(user.id) }, { ...patch, updated_at: now() });
  const back = t.scheduled_day ? "scheduled" : "idea";

  const claimed = await update("topics", { id: eq(t.id), user_id: eq(user.id), status: inList(["idea", "scheduled", "failed"]) }, { status: "running", updated_at: now() });
  if (claimed.length !== 1) return { ok: false, error: "Este tema ya se está escribiendo.", retry: false };

  const writer = isUuid(t.writer_id) ? await getWriter(user.id, t.writer_id) : null;
  if (!writer) {
    await set({ status: "failed", error: "El redactor de este tema ya no existe. Elige otro." });
    return { ok: false, error: "El redactor de este tema ya no existe.", retry: false };
  }

  let draft;
  try {
    draft = await createDraft(user.id, writer, topicBrief(t), t.format);
  } catch (e) {
    await set({ status: back, error: `No se pudo escribir: ${e instanceof Error ? e.message : "error"}`.slice(0, 200) });
    return { ok: false, error: "No se pudo escribir el borrador.", retry: true };
  }
  if (!draft.ok) {
    await set({ status: back, error: draft.error });
    return { ok: false, error: draft.error, retry: true };
  }

  if (opts.allowSend && t.mode === "send") {
    const r = await deliverNewsletter(user, draft.id, base);
    if (r.ok) {
      await set({ status: "sent", error: null, newsletter_id: draft.id });
      return { ok: true, newsletterId: draft.id, sent: r.sent };
    }
    await set({ status: "drafted", error: `Borrador listo, pero no se envió: ${r.error}`.slice(0, 200), newsletter_id: draft.id });
    return { ok: true, newsletterId: draft.id, note: `No se envió: ${r.error}` };
  }
  await set({ status: "drafted", error: null, newsletter_id: draft.id });
  return { ok: true, newsletterId: draft.id };
}
