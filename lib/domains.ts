import "server-only";
import { eq, insert, one, remove, update } from "./db";
import { platformDomain } from "./email";

/**
 * Dominios de envío propios (Premium). Cada dominio se da de alta en la cuenta de Resend de AutoMailX;
 * el cliente pega los registros DNS en su proveedor y, cuando Resend los verifica, sus newsletters
 * salen desde su propia dirección (p. ej. hola@sucafeteria.com).
 * Necesita una clave de Resend con permiso "Full access" (una de solo envío no puede gestionar dominios).
 */

export type DnsRecord = { record: string; name: string; type: string; value: string; ttl?: string; priority?: number; status?: string };

export type SenderDomain = {
  user_id: string;
  resend_id: string;
  name: string;
  from_local: string;
  status: string; // not_started | pending | verified | failed | temporary_failure
  records: DnsRecord[];
  created_at: string;
  checked_at: string | null;
  verified_at: string | null;
};

// Correos gratuitos: no son tuyos, no se pueden verificar.
const FREE_PROVIDERS = new Set([
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.es", "outlook.com", "outlook.es", "live.com", "msn.com",
  "yahoo.com", "yahoo.es", "icloud.com", "me.com", "mac.com", "aol.com", "proton.me", "protonmail.com", "gmx.com", "gmx.es", "zoho.com",
]);

export function normalizeDomain(input: unknown): string | { error: string } {
  if (typeof input !== "string") return { error: "Escribe tu dominio." };
  let d = input.trim().toLowerCase();
  d = d.replace(/^[a-z]+:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
  if (d.includes("@")) d = d.split("@")[1];
  if (!/^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(d)) return { error: "Eso no parece un dominio. Ejemplo: tucafeteria.com" };
  if (FREE_PROVIDERS.has(d)) return { error: `${d} es un correo gratuito y no es tuyo, así que no se puede verificar. Necesitas un dominio propio (por ejemplo tunegocio.com).` };
  const own = platformDomain();
  if (own && (d === own || d.endsWith(`.${own}`))) return { error: "Ese dominio es el de AutoMailX: ya lo usas en el plan gratis." };
  return d;
}

export const isLocalPart = (x: unknown): x is string => typeof x === "string" && /^[a-z0-9](?:[a-z0-9._-]{0,38}[a-z0-9])?$/i.test(x);

export const isVerified = (d: Pick<SenderDomain, "status"> | null | undefined) => d?.status === "verified";

// ---------------- API de Resend ----------------

class ResendError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

function friendly(status: number, body: string): string {
  if (status === 401) return "La clave de Resend no es válida.";
  if (status === 403 || /restricted|permission|not allowed/i.test(body))
    return "La clave de Resend no puede gestionar dominios. En Resend > API Keys crea una con permiso «Full access» y ponla en RESEND_API_KEY.";
  if (status === 409 || /already|exists|registered/i.test(body)) return "Ese dominio ya está dado de alta en Resend (quizá por otra cuenta). Si es tuyo, escríbenos.";
  if (status === 422) return `Resend no acepta ese dominio: ${body.slice(0, 160)}`;
  if (status === 429) return "Resend dice que vamos demasiado rápido. Prueba en un minuto.";
  return `Resend ${status}: ${body.slice(0, 160)}`;
}

async function resend<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!process.env.RESEND_API_KEY) throw new ResendError("Falta RESEND_API_KEY.", 503);
  let res: Response;
  try {
    res = await fetch(`${process.env.RESEND_API_URL || "https://api.resend.com"}${path}`, {
      method,
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new ResendError("No se pudo hablar con Resend. Prueba en un momento.", 503);
  }
  const text = await res.text();
  if (!res.ok) throw new ResendError(friendly(res.status, text), res.status);
  return (text ? JSON.parse(text) : {}) as T;
}

type ResendDomain = { id: string; name: string; status?: string; records?: DnsRecord[] };

const cleanRecords = (rs: unknown): DnsRecord[] =>
  Array.isArray(rs)
    ? rs
        .map((r) => r as Record<string, unknown>)
        .map((r) => ({
          record: String(r.record ?? ""),
          name: String(r.name ?? ""),
          type: String(r.type ?? ""),
          value: String(r.value ?? ""),
          ttl: r.ttl === undefined ? undefined : String(r.ttl),
          priority: typeof r.priority === "number" ? r.priority : undefined,
          status: r.status === undefined ? undefined : String(r.status),
        }))
        .filter((r) => r.type && r.value)
    : [];

// ---------------- Operaciones ----------------

export async function getDomain(userId: string): Promise<SenderDomain | null> {
  return one<SenderDomain>("sender_domains", { user_id: eq(userId) });
}

export type DomainResult = { ok: true; domain: SenderDomain } | { ok: false; error: string; status: number };

const fail = (e: unknown): DomainResult =>
  e instanceof ResendError ? { ok: false, error: e.message, status: e.status >= 500 ? 502 : 400 } : { ok: false, error: "Algo ha fallado. Prueba otra vez.", status: 500 };

export async function addDomain(userId: string, rawName: unknown, local: string): Promise<DomainResult> {
  const name = normalizeDomain(rawName);
  if (typeof name !== "string") return { ok: false, error: name.error, status: 400 };
  if (await getDomain(userId)) return { ok: false, error: "Ya tienes un dominio. Quítalo antes de poner otro.", status: 409 };
  if (await one("sender_domains", { select: "user_id", name: eq(name) })) return { ok: false, error: "Ese dominio ya lo está usando otra cuenta de AutoMailX.", status: 409 };
  try {
    const d = await resend<ResendDomain>("POST", "/domains", { name, region: "eu-west-1" });
    // Aperturas y clics activados de serie para que funcionen las métricas.
    await resend("PATCH", `/domains/${d.id}`, { open_tracking: true, click_tracking: true }).catch(() => {});
    const [row] = await insert<SenderDomain>("sender_domains", {
      user_id: userId,
      resend_id: d.id,
      name,
      from_local: local,
      status: d.status ?? "not_started",
      records: cleanRecords(d.records),
      checked_at: new Date().toISOString(),
    });
    return { ok: true, domain: row };
  } catch (e) {
    return fail(e);
  }
}

/** Pide a Resend que compruebe los DNS (si `verify`) y guarda el estado actual. */
export async function refreshDomain(userId: string, opts: { verify: boolean }): Promise<DomainResult> {
  const cur = await getDomain(userId);
  if (!cur) return { ok: false, error: "No tienes ningún dominio.", status: 404 };
  try {
    if (opts.verify && cur.status !== "verified") await resend("POST", `/domains/${cur.resend_id}/verify`);
    const d = await resend<ResendDomain>("GET", `/domains/${cur.resend_id}`);
    const status = d.status ?? cur.status;
    const records = cleanRecords(d.records);
    const now = new Date().toISOString();
    const [row] = await update<SenderDomain>("sender_domains", { user_id: eq(userId) }, {
      status,
      records: records.length ? records : cur.records,
      checked_at: now,
      ...(status === "verified" && !cur.verified_at ? { verified_at: now } : {}),
    });
    return { ok: true, domain: row ?? cur };
  } catch (e) {
    return fail(e);
  }
}

export async function setLocalPart(userId: string, local: string): Promise<boolean> {
  return (await update("sender_domains", { user_id: eq(userId) }, { from_local: local })).length === 1;
}

export async function removeDomain(userId: string): Promise<DomainResult | { ok: true }> {
  const cur = await getDomain(userId);
  if (!cur) return { ok: true };
  try {
    await resend("DELETE", `/domains/${cur.resend_id}`);
  } catch (e) {
    // Si en Resend ya no existe, lo quitamos igualmente de aquí.
    if (!(e instanceof ResendError && e.status === 404)) return fail(e);
  }
  await remove("sender_domains", { user_id: eq(userId) });
  return { ok: true };
}

/** Dirección propia con la que enviar, o null si no hay (o el usuario ya no es Premium). */
export async function senderAddressFor(userId: string): Promise<string | null> {
  const [u, d] = await Promise.all([one<{ plan: string }>("users", { select: "plan", id: eq(userId) }), getDomain(userId)]);
  if (u?.plan !== "pro" || !isVerified(d)) return null;
  return `${d!.from_local}@${d!.name}`;
}

/**
 * Activa el seguimiento de aperturas y clics en el dominio compartido (el de MAIL_FROM),
 * para que las métricas funcionen en las cuentas gratis. Se hace una vez desde Administración.
 */
export async function enablePlatformTracking(): Promise<{ ok: true; domain: string } | { ok: false; error: string }> {
  const name = platformDomain();
  if (!name) return { ok: false, error: "Falta MAIL_FROM con tu dominio." };
  try {
    const list = await resend<{ data?: ResendDomain[] }>("GET", "/domains");
    const d = (list.data ?? []).find((x) => x.name?.toLowerCase() === name);
    if (!d) return { ok: false, error: `No encuentro ${name} en tu cuenta de Resend.` };
    await resend("PATCH", `/domains/${d.id}`, { open_tracking: true, click_tracking: true });
    return { ok: true, domain: name };
  } catch (e) {
    return { ok: false, error: e instanceof ResendError ? e.message : "No se pudo hablar con Resend." };
  }
}
