import "server-only";

/**
 * Base de datos: Supabase a través de su API HTTP (PostgREST), con la clave secreta del servidor.
 *
 * Por qué HTTP y no una conexión Postgres directa: en Vercel cada petición puede arrancar una
 * instancia nueva, y las conexiones TCP a Postgres se quedaban colgadas o se pisaban.
 * Por HTTP no hay conexiones que mantener: cada consulta es una petición corta con su timeout.
 *
 * La web NUNCA cambia el esquema. El esquema vive en supabase/migrations.
 */

const TIMEOUT_MS = 12_000;

function config() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
  return { url, key };
}

export const dbConfigured = () => {
  const { url, key } = config();
  return !!url && !!key;
};

export class DbError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
  get isUniqueViolation() {
    return this.code === "23505";
  }
}

type Params = Record<string, string | number | undefined>;

/** Filtros al estilo PostgREST: eq("x") -> "eq.x". */
export const eq = (v: string | number | boolean) => `eq.${v}`;
export const neq = (v: string | number) => `neq.${v}`;
export const gt = (v: string | number) => `gt.${v}`;
export const gte = (v: string | number) => `gte.${v}`;
export const lt = (v: string | number) => `lt.${v}`;
export const lte = (v: string | number) => `lte.${v}`;
export const isNull = "is.null";
export const notNull = "not.is.null";
export const inList = (vs: (string | number)[]) => `in.(${vs.map((v) => `"${String(v).replace(/"/g, "")}"`).join(",")})`;

async function request(
  method: string,
  path: string,
  opts: { params?: Params; body?: unknown; prefer?: string[] } = {},
): Promise<Response> {
  const { url, key } = config();
  if (!url || !key) throw new DbError("Falta conectar la base de datos (SUPABASE_URL y la clave secreta).", 503);

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(opts.params ?? {})) if (v !== undefined) qs.append(k, String(v));
  const full = `${url}/rest/v1/${path}${qs.size ? `?${qs}` : ""}`;

  const headers: Record<string, string> = { apikey: key, "content-type": "application/json", accept: "application/json" };
  if (key.startsWith("eyJ")) headers.authorization = `Bearer ${key}`;
  if (opts.prefer?.length) headers.prefer = opts.prefer.join(",");

  let res: Response;
  try {
    res = await fetch(full, {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    const timeout = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    throw new DbError(timeout ? "La base de datos ha tardado demasiado en responder." : "No se pudo conectar con la base de datos.", 503);
  }
  if (!res.ok) {
    let code: string | undefined;
    let message = `Error de base de datos (${res.status})`;
    try {
      const j = (await res.json()) as { code?: string; message?: string };
      code = j.code;
      if (j.message) message = j.message;
    } catch {
      /* sin cuerpo */
    }
    throw new DbError(message, res.status, code);
  }
  return res;
}

const parse = async <T>(res: Response): Promise<T> => {
  const t = await res.text();
  return (t ? JSON.parse(t) : null) as T;
};

/** SELECT. `params` admite select, order, limit, offset y filtros (col: "eq.x"). */
export async function select<T>(table: string, params: Params = {}): Promise<T[]> {
  return (await parse<T[]>(await request("GET", table, { params }))) ?? [];
}

/** Primera fila o null. */
export async function one<T>(table: string, params: Params = {}): Promise<T | null> {
  const rows = await select<T>(table, { ...params, limit: 1 });
  return rows[0] ?? null;
}

/** Número de filas que cumplen los filtros. */
export async function count(table: string, params: Params = {}): Promise<number> {
  const res = await request("GET", table, { params: { select: "*", ...params, limit: 0 }, prefer: ["count=exact"] });
  const range = res.headers.get("content-range") ?? "";
  const total = Number(range.split("/")[1]);
  return Number.isFinite(total) ? total : 0;
}

/** INSERT (una fila o varias). Devuelve las filas insertadas. */
export async function insert<T>(
  table: string,
  rows: Record<string, unknown> | Record<string, unknown>[],
  opts: { onConflict?: string; ignoreDuplicates?: boolean; merge?: boolean } = {},
): Promise<T[]> {
  const prefer = ["return=representation"];
  if (opts.ignoreDuplicates) prefer.push("resolution=ignore-duplicates");
  if (opts.merge) prefer.push("resolution=merge-duplicates");
  const params: Params = opts.onConflict ? { on_conflict: opts.onConflict } : {};
  return (await parse<T[]>(await request("POST", table, { params, body: rows, prefer }))) ?? [];
}

/** UPDATE con filtros. Devuelve las filas cambiadas (sirve para "reclamar" algo de forma atómica). */
export async function update<T>(table: string, filters: Params, patch: Record<string, unknown>): Promise<T[]> {
  if (!Object.keys(filters).length) throw new Error("update sin filtros");
  return (await parse<T[]>(await request("PATCH", table, { params: filters, body: patch, prefer: ["return=representation"] }))) ?? [];
}

/** DELETE con filtros. Devuelve cuántas filas se borraron. */
export async function remove(table: string, filters: Params): Promise<number> {
  if (!Object.keys(filters).length) throw new Error("delete sin filtros");
  const rows = await parse<unknown[]>(
    await request("DELETE", table, { params: { ...filters, select: Object.keys(filters)[0] }, prefer: ["return=representation"] }),
  );
  return rows?.length ?? 0;
}

/** Llama a una función SQL (definida en las migraciones). */
export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  return parse<T>(await request("POST", `rpc/${fn}`, { body: args }));
}
