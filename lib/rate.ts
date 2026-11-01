import { dbConfigured, q1, run } from "./db";

const today = () => new Date().toISOString().slice(0, 10);

// Sin base de datos (solo la demo pública de la portada) contamos en memoria.
const mem = new Map<string, number>();

/** Cuenta un uso para `key` hoy. Devuelve false si ya se superó el límite. */
export async function hit(key: string, limit: number): Promise<boolean> {
  const day = today();

  if (!dbConfigured) {
    const k = `${key}|${day}`;
    const n = mem.get(k) ?? 0;
    if (n >= limit) return false;
    if (mem.size > 5000) mem.clear();
    mem.set(k, n + 1);
    return true;
  }

  // limpieza ocasional de datos caducados
  if (Math.random() < 0.02) {
    await run("DELETE FROM usage WHERE day < ?", [new Date(Date.now() - 3 * 86400_000).toISOString().slice(0, 10)]);
    await run("DELETE FROM sessions WHERE expires_at < ?", [Date.now()]);
    await run("DELETE FROM login_tokens WHERE expires_at < ?", [Date.now() - 86400_000]);
  }
  await run("INSERT INTO usage(key, day, count) VALUES(?, ?, 0) ON CONFLICT(key, day) DO NOTHING", [key, day]);
  const changed = await run("UPDATE usage SET count = count + 1 WHERE key = ? AND day = ? AND count < ?", [
    key,
    day,
    limit,
  ]);
  return changed === 1;
}

export async function used(key: string): Promise<number> {
  if (!dbConfigured) return mem.get(`${key}|${today()}`) ?? 0;
  const r = await q1<{ count: number }>("SELECT count FROM usage WHERE key = ? AND day = ?", [key, today()]);
  return r?.count ?? 0;
}
