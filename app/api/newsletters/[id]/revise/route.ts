import { reviseNewsletter } from "@/lib/ai";
import { getNewsletter, getWriter, parseContent } from "@/lib/data";
import { eq, update } from "@/lib/db";
import { authed, fail, json, readBody } from "@/lib/http";
import { lookOf, writerFromRow } from "@/lib/newsletter";
import { FREE } from "@/lib/plans";
import { hit } from "@/lib/rate";
import { clean } from "@/lib/util";

export const maxDuration = 120;

type P = { id: string };

/** "Hazlo más corto", "más gracioso"... El redactor reescribe la pieza. */
export const POST = authed<P>(async (req, user, { id }) => {
  const n = await getNewsletter(user.id, id);
  if (!n) return fail("No encontrada.", 404);
  if (n.status !== "draft") return fail("Esta newsletter ya se envió.", 409);
  const b = await readBody(req);
  const instruction = clean(b.instruction, 500);
  if (instruction.length < 3) return fail("Dile qué quieres cambiar.");
  const current = parseContent(b.content) ?? n.content;
  if (!(await hit(`revise:${user.id}`, FREE.revisionsPerDay))) return fail("Has llegado al límite de cambios de hoy.", 429);

  const writer =
    (await getWriter(user.id, n.writer_id)) ??
    writerFromRow({ kind: n.look?.animal ? "animal" : "custom", animal: n.look?.animal ?? "zorro", name: n.look?.name ?? "Redactor", avatar: n.look?.emoji, color: n.look?.color });
  const r = await reviseNewsletter(current, instruction, writer, n.brief, n.format);
  if (r.error) return fail(`No se pudo aplicar el cambio: ${r.error}`, 502);

  await update("newsletters", { id: eq(id), user_id: eq(user.id), status: eq("draft") }, { content: r.newsletter, look: lookOf(writer), updated_at: new Date().toISOString() });
  return json({ ok: true, content: r.newsletter, simulated: r.source === "simulated" });
});
