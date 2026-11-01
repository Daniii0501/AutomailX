import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { q1, run } from "./db";
import { isEmail, newToken, normEmail, now, sha, slugify, uid } from "./util";

export const COOKIE = "amx_session";
const SESSION_MS = 30 * 24 * 3600 * 1000;
const LOGIN_MS = 15 * 60 * 1000;

export type User = { id: string; email: string };

/**
 * Con el modo demo activo (sin clave de correo ni base de datos real) el enlace de acceso
 * se muestra en pantalla. Con claves reales, el enlace solo llega por correo.
 */
export const demoLogin =
  process.env.ALLOW_DEMO_LOGIN === "1" || (!process.env.RESEND_API_KEY && !process.env.TURSO_DATABASE_URL);

export async function createLoginToken(emailRaw: string): Promise<string | "limit" | "invalid"> {
  const email = normEmail(emailRaw);
  if (!isEmail(email)) return "invalid";
  const recent = await q1<{ n: number }>(
    "SELECT COUNT(*) AS n FROM login_tokens WHERE email = ? AND created_at > ?",
    [email, now() - 3600 * 1000],
  );
  if ((recent?.n ?? 0) >= 5) return "limit";
  const raw = newToken();
  await run("INSERT INTO login_tokens(token_hash, email, expires_at, created_at) VALUES(?,?,?,?)", [
    sha(raw),
    email,
    now() + LOGIN_MS,
    now(),
  ]);
  return raw;
}

/** Canjea el enlace mágico: crea el usuario si no existe y devuelve el token de sesión. */
export async function consumeLoginToken(raw: string): Promise<string | null> {
  const h = sha(raw);
  const row = await q1<{ email: string }>(
    "SELECT email FROM login_tokens WHERE token_hash = ? AND used = 0 AND expires_at > ?",
    [h, now()],
  );
  if (!row) return null;
  const claimed = await run("UPDATE login_tokens SET used = 1 WHERE token_hash = ? AND used = 0", [h]);
  if (claimed !== 1) return null;

  let user = await q1<User>("SELECT id, email FROM users WHERE email = ?", [row.email]);
  if (!user) {
    const id = uid();
    await run("INSERT INTO users(id, email, created_at) VALUES(?,?,?)", [id, row.email, now()]);
    user = { id, email: row.email };
    await ensurePublication(user);
  }
  const session = newToken();
  await run("INSERT INTO sessions(token_hash, user_id, expires_at) VALUES(?,?,?)", [
    sha(session),
    user.id,
    now() + SESSION_MS,
  ]);
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
  const exists = await q1("SELECT user_id FROM publications WHERE user_id = ?", [user.id]);
  if (exists) return;
  const local = user.email.split("@")[0];
  const slug = `${slugify(local)}-${newToken().slice(0, 5).toLowerCase().replace(/[^a-z0-9]/g, "x")}`;
  await run(
    "INSERT INTO publications(user_id, slug, name, sender_name, reply_to, cadence_day, created_at) VALUES(?,?,?,?,?,?,?)",
    [user.id, slug, "Mi newsletter", local.charAt(0).toUpperCase() + local.slice(1, 40), user.email, null, now()],
  );
}

export async function userFromToken(raw: string | undefined): Promise<User | null> {
  if (!raw) return null;
  return q1<User>(
    `SELECT u.id AS id, u.email AS email FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`,
    [sha(raw), now()],
  );
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

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (raw) await run("DELETE FROM sessions WHERE token_hash = ?", [sha(raw)]);
}
