import { NextResponse } from "next/server";
import { body } from "@/lib/api";
import { consumeLoginToken, sessionCookie } from "@/lib/auth";
import { q1 } from "@/lib/db";
import { json, sameOrigin, sha } from "@/lib/util";

/**
 * Canjea el enlace de acceso. Es un POST (con botón en /entrar) a propósito:
 * así los filtros de correo que "visitan" los enlaces no los gastan.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Petición no permitida." }, 403);
  const { token } = await body<{ token?: string }>(req);
  const session = typeof token === "string" && token ? await consumeLoginToken(token) : null;
  if (!session) return json({ error: "Este enlace ya no es válido. Pide uno nuevo." }, 400);

  // ¿Es su primera vez? Si no tiene redactores, lo llevamos a crear el suyo.
  const row = await q1<{ n: number }>(
    `SELECT COUNT(*) AS n FROM writers w JOIN sessions s ON s.user_id = w.user_id WHERE s.token_hash = ?`,
    [sha(session)],
  );
  const dest = (row?.n ?? 0) === 0 ? "/panel/redactores/nuevo" : "/panel";
  const res = NextResponse.json({ ok: true, dest });
  const c = sessionCookie(session);
  res.cookies.set(c.name, c.value, c);
  return res;
}
