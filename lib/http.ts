import "server-only";
import { COOKIE, userFromToken, type User } from "./auth";
import { DbError } from "./db";

export const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "cache-control": "no-store" } });

export const fail = (error: string, status = 400) => json({ error }, status);

function cookieFrom(req: Request, name: string): string | undefined {
  const raw = req.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

/** Protección CSRF: las peticiones que cambian datos deben venir de nuestra propia web. */
export function sameOrigin(req: Request): boolean {
  if (req.method === "GET" || req.method === "HEAD") return true;
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Dirección pública de la web (para enlaces de correo). */
export function baseUrl(req?: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, "");
  if (req) {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
    if (host) return `${proto}://${host}`;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  const type = req.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      const b = await req.json();
      return b && typeof b === "object" ? (b as Record<string, unknown>) : {};
    }
    const f = await req.formData();
    return Object.fromEntries(f.entries());
  } catch {
    return {};
  }
}

type Ctx<P> = { params: Promise<P> };

/** Ruta del panel: exige sesión y mismo origen; convierte errores en mensajes claros. */
export function authed<P = Record<string, never>>(fn: (req: Request, user: User, params: P) => Promise<Response>) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      if (!sameOrigin(req)) return fail("Petición no permitida.", 403);
      const user = await userFromToken(cookieFrom(req, COOKIE));
      if (!user) return fail("Tu sesión ha caducado. Vuelve a entrar.", 401);
      return await fn(req, user, (await ctx.params) ?? ({} as P));
    } catch (e) {
      return handleError(e);
    }
  };
}

/** Ruta pública. */
export function open<P = Record<string, never>>(fn: (req: Request, params: P) => Promise<Response>) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      return await fn(req, (await ctx.params) ?? ({} as P));
    } catch (e) {
      return handleError(e);
    }
  };
}

function handleError(e: unknown): Response {
  console.error("[api]", e);
  if (e instanceof DbError && e.status === 503) return fail(e.message, 503);
  return fail("Algo ha fallado por nuestra parte. Vuelve a intentarlo en un momento.", 500);
}

export { cookieFrom };
