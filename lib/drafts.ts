import { writeNewsletter } from "./ai";
import type { Writer } from "./data";
import { run } from "./db";
import { isFormat, type FormatId } from "./formats";
import { FREE } from "./plans";
import { hit } from "./rate";
import { now, uid } from "./util";

export type DraftResult = { ok: true; id: string; source: string } | { ok: false; reason: "limit" };

/** Escribe una newsletter con el redactor y la guarda como borrador. Cuenta para el límite diario de IA. */
export async function createDraft(userId: string, writer: Writer, brief: string, format?: string): Promise<DraftResult> {
  if (!(await hit(`ai:${userId}`, FREE.aiPerDay))) return { ok: false, reason: "limit" };

  const fmt: FormatId = isFormat(format) ? format : writer.format;
  const { newsletter, source } = await writeNewsletter(brief, writer, fmt);
  const id = uid();
  await run(
    "INSERT INTO newsletters(id,user_id,writer_id,brief,content,status,source,format,created_at,updated_at) VALUES(?,?,?,?,?,'draft',?,?,?,?)",
    [id, userId, writer.id, brief, JSON.stringify(newsletter), source, fmt, now(), now()],
  );
  return { ok: true, id, source };
}
