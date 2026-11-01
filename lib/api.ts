import { COOKIE, userFromToken, type User } from "./auth";
import { json, sameOrigin } from "./util";

function readCookie(req: Request, name: string): string | undefined {
  const raw = req.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

/** Exige misma procedencia (CSRF) y sesión válida. */
export async function guard(req: Request): Promise<User | Response> {
  if (!sameOrigin(req)) return json({ error: "Petición no permitida." }, 403);
  const user = await userFromToken(readCookie(req, COOKIE));
  if (!user) return json({ error: "Tu sesión ha caducado. Vuelve a entrar." }, 401);
  return user;
}

export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    const b = await req.json();
    return (b && typeof b === "object" ? b : {}) as T;
  } catch {
    return {} as T;
  }
}
