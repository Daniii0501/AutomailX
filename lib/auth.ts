import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { count, dbConfigured, eq, gt, insert, isNull, one, remove, update } from "./db";
import { isEmail, newToken, normEmail, sha, slugify } from "./util";

export const COOKIE = "amx_session";
const SESSION_MS = 30 * 24 * 3600 * 1000;
const LOGIN_MS = 15 * 60 * 1000;

export type User = { id: string; email: string };

/**
 * Entrada directa: el enlace de acceso se muestra en pantalla en vez de enviarse por correo.
 * SOLO para pruebas (ALLOW_DEMO_LOGIN=1): con ella cualquiera podría entrar con el correo de otra persona.
 */
export const demoLogin = () => process.env.ALLOW_DEMO_LOGIN === "1";

const iso = (msFromNow: number) => new Date(Date.now() + msFromNow).toISOString();

export async function createLoginToken(emailRaw: unknown): Promise<{ token: string; email: string } | "limit" | "invalid"> {
  const email = normEmail(emailRaw);
  if (!isEmail(email)) return "invalid";
  const recent = await count("login_tokens", { email: eq(email), created_at: gt(iso(-3600_000)) });
  if (recent >= 5) return "limit";
  const token = newToken();
  await insert("login_tokens", { token_hash: sha(token), email, expires_at: iso(LOGIN_MS) });
  return { token, email };
}

/** Canjea el enlace mágico (una sola vez): crea el usuario si no existe y devuelve el token de sesión. */
export async function consumeLoginToken(raw: string): Promise<string | null> {
  if (!raw || raw.length > 100) return null;
  const now = new Date().toISOString();
  // Reclamación atómica: solo una petición puede marcarlo como usado.
  const [row] = await update<{ email: string }>(
    "login_tokens",
    { token_hash: eq(sha(raw)), used_at: isNull, expires_at: gt(now) },
    { used_at: now },
  );
  if (!row) return null;

  let user = await one<User>("users", { select: "id,email", email: eq(row.email) });
  if (!user) {
    try {
      [user] = await insert<User>("users", { email: row.email });
    } catch {
      user = await one<User>("users", { select: "id,email", email: eq(row.email) }); // carrera: ya existía
    }
  }
  if (!user) return null;
  await ensurePublication(user);

  const session = newToken();
  await insert("sessions", { token_hash: sha(session), user_id: user.id, expires_at: iso(SESSION_MS) });
  return session;
}

export const sessionCookie = (value: string, maxAgeMs = SESSION_MS) => ({
  name: COOKIE,
  value,
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: Math.floor(maxAgeMs / 1000),
});

export async function ensurePublication(user: User): Promise<void> {
  const exists = await one("publications", { select: "user_id", user_id: eq(user.id) });
  if (exists) return;
  const local = user.email.split("@")[0];
  const sender = local.charAt(0).toUpperCase() + local.slice(1, 40);
  for (let i = 0; i < 3; i++) {
    const slug = `${slugify(local)}-${newToken(4).toLowerCase().replace(/[^a-z0-9]/g, "x").slice(0, 5)}`;
    try {
      await insert("publications", { user_id: user.id, slug, name: `La newsletter de ${sender}`, sender_name: sender, reply_to: user.email }, { ignoreDuplicates: true, onConflict: "user_id" });
      return;
    } catch {
      /* slug repetido: probamos otro */
    }
  }
}

export async function userFromToken(raw: string | undefined): Promise<User | null> {
  if (!raw || !dbConfigured()) return null;
  const s = await one<{ user_id: string }>("sessions", { select: "user_id", token_hash: eq(sha(raw)), expires_at: gt(new Date().toISOString()) });
  if (!s) return null;
  return one<User>("users", { select: "id,email", id: eq(s.user_id) });
}

/** Usuario de la sesión actual (o null). Se calcula una vez por petición. */
export const getUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  return userFromToken(jar.get(COOKIE)?.value);
});

export async function requireUser(): Promise<User> {
  const u = await getUser();
  if (!u) redirect("/login");
  return u;
}

export async function endSession(raw: string | undefined): Promise<void> {
  if (raw) await remove("sessions", { token_hash: eq(sha(raw)) });
}
