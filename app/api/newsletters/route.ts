import { getWriter } from "@/lib/data";
import { createDraft } from "@/lib/drafts";
import { isFormat } from "@/lib/formats";
import { authed, fail, json, readBody } from "@/lib/http";
import { clean } from "@/lib/util";

export const maxDuration = 180;

/** Crea un borrador: el redactor escribe a partir de lo que le cuentas. */
export const POST = authed(async (req, user) => {
  const b = await readBody(req);
  const brief = clean(b.brief, 4000);
  if (brief.length < 20) return fail("Cuéntale un poco más (al menos una frase o dos).");
  const writer = await getWriter(user.id, typeof b.writerId === "string" ? b.writerId : "");
  if (!writer) return fail("Elige un redactor.");
  const r = await createDraft(user.id, writer, brief, isFormat(b.format) ? b.format : "auto");
  if (!r.ok) return fail(r.error, r.status);
  return json({ ok: true, id: r.id, source: r.source });
});
