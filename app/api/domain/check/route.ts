import { refreshDomain } from "@/lib/domains";
import { authed, fail, json } from "@/lib/http";
import { hit } from "@/lib/rate";

/** "Comprobar ahora": Resend mira los DNS y nos dice si ya está verificado. */
export const POST = authed(async (_req, user) => {
  if (!(await hit(`domain-check:${user.id}`, 60))) return fail("Demasiadas comprobaciones por hoy. Prueba mañana.", 429);
  const r = await refreshDomain(user.id, { verify: true });
  if (!r.ok) return fail(r.error, r.status);
  return json({ ok: true, domain: r.domain });
});
