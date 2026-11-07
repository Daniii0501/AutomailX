import { getAccount } from "@/lib/data";
import { addDomain, isLocalPart, removeDomain, setLocalPart } from "@/lib/domains";
import { authed, fail, json, readBody } from "@/lib/http";
import { hit } from "@/lib/rate";

const PRO_ONLY = "Enviar desde tu propio dominio es una función Premium.";

/** Da de alta tu dominio en Resend y devuelve los registros DNS que tienes que poner. */
export const POST = authed(async (req, user) => {
  if ((await getAccount(user.id)).plan !== "pro") return fail(PRO_ONLY, 403);
  if (!(await hit(`domain:${user.id}`, 10))) return fail("Demasiados intentos por hoy.", 429);
  const b = await readBody(req);
  const local = typeof b.local === "string" && b.local.trim() ? b.local.trim().toLowerCase() : "hola";
  if (!isLocalPart(local)) return fail("La parte antes de la @ solo puede tener letras, números, puntos y guiones.");
  const r = await addDomain(user.id, b.name, local);
  if (!r.ok) return fail(r.error, r.status);
  return json({ ok: true, domain: r.domain });
});

/** Cambia la dirección (lo que va antes de la @). */
export const PATCH = authed(async (req, user) => {
  const b = await readBody(req);
  const local = typeof b.local === "string" ? b.local.trim().toLowerCase() : "";
  if (!isLocalPart(local)) return fail("La parte antes de la @ solo puede tener letras, números, puntos y guiones.");
  if (!(await setLocalPart(user.id, local))) return fail("No tienes ningún dominio.", 404);
  return json({ ok: true });
});

export const DELETE = authed(async (_req, user) => {
  const r = await removeDomain(user.id);
  if (!r.ok) return fail(r.error, r.status);
  return json({ ok: true });
});
