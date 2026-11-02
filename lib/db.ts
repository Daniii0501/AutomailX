import postgres from "postgres";

/**
 * Base de datos: Postgres (Supabase).
 * La dirección de conexión se lee de DATABASE_URL o, si usas la integración de Supabase
 * en Vercel, de POSTGRES_URL (la que usa el "pooler", pensada para servidores sin estado).
 */
const rawUrl = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

export const dbConfigured = rawUrl().length > 0;

export class DbNotConfigured extends Error {
  constructor() {
    super("Falta conectar la base de datos (DATABASE_URL).");
  }
}

// Todas las columnas de fecha son BIGINT (milisegundos): Postgres las devolvería como texto.
const TABLES: [string, string][] = [
  ["users", `CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, created_at BIGINT NOT NULL)`],
  ["sessions", `CREATE TABLE IF NOT EXISTS sessions(
  token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at BIGINT NOT NULL)`],
  ["login_tokens", `CREATE TABLE IF NOT EXISTS login_tokens(
  token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, expires_at BIGINT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0, created_at BIGINT NOT NULL)`],
  ["publications", `CREATE TABLE IF NOT EXISTS publications(
  user_id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  sender_name TEXT NOT NULL, reply_to TEXT, cadence_day INTEGER, created_at BIGINT NOT NULL)`],
  ["writers", `CREATE TABLE IF NOT EXISTS writers(
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, animal TEXT NOT NULL, name TEXT NOT NULL,
  about TEXT NOT NULL DEFAULT '', formality INTEGER NOT NULL DEFAULT 40,
  length TEXT NOT NULL DEFAULT 'medio', emojis INTEGER NOT NULL DEFAULT 1,
  sample TEXT NOT NULL DEFAULT '', created_at BIGINT NOT NULL)`],
  ["subscribers", `CREATE TABLE IF NOT EXISTS subscribers(
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, email TEXT NOT NULL, name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL, token TEXT UNIQUE NOT NULL, source TEXT NOT NULL DEFAULT 'manual',
  created_at BIGINT NOT NULL, UNIQUE(user_id, email))`],
  ["newsletters", `CREATE TABLE IF NOT EXISTS newsletters(
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, writer_id TEXT NOT NULL, brief TEXT NOT NULL,
  content TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', delivery TEXT,
  recipients INTEGER NOT NULL DEFAULT 0, source TEXT NOT NULL DEFAULT 'simulated',
  created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL, sent_at BIGINT)`],
  ["usage", `CREATE TABLE IF NOT EXISTS usage(
  key TEXT NOT NULL, day TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(key, day))`],
  ["topics", `CREATE TABLE IF NOT EXISTS topics(
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, writer_id TEXT NOT NULL, title TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '', format TEXT NOT NULL DEFAULT 'auto', scheduled_day TEXT,
  mode TEXT NOT NULL DEFAULT 'draft', status TEXT NOT NULL DEFAULT 'idea',
  newsletter_id TEXT, error TEXT, created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL)`],
];

// Columnas añadidas después de crear las tablas (redactores a medida y estilos de copy)
const COLUMNS: [string, string, string][] = [
  ["writers", "kind", "TEXT NOT NULL DEFAULT 'animal'"],
  ["writers", "avatar", "TEXT NOT NULL DEFAULT ''"],
  ["writers", "color", "TEXT NOT NULL DEFAULT ''"],
  ["writers", "profile", "TEXT NOT NULL DEFAULT '{}'"],
  ["writers", "format", "TEXT NOT NULL DEFAULT 'auto'"],
  ["newsletters", "format", "TEXT NOT NULL DEFAULT 'auto'"],
  ["topics", "send_hour", "INTEGER NOT NULL DEFAULT 8"],
];

const INDEXES: [string, string][] = [
  ["idx_login_email", "CREATE INDEX IF NOT EXISTS idx_login_email ON login_tokens(email, created_at)"],
  ["idx_writers_user", "CREATE INDEX IF NOT EXISTS idx_writers_user ON writers(user_id)"],
  ["idx_news_user", "CREATE INDEX IF NOT EXISTS idx_news_user ON newsletters(user_id, created_at)"],
  ["idx_topics_user", "CREATE INDEX IF NOT EXISTS idx_topics_user ON topics(user_id, scheduled_day)"],
];

/** Súbelo cuando cambie el esquema: las instancias que ven la versión al día no tocan nada. */
const SCHEMA_VERSION = 5;
const META = "amx_meta";

const rowsOf = async (tx: { unsafe: postgres.Sql["unsafe"] }, text: string) => (await tx.unsafe(text)) as unknown as Record<string, string>[];

/**
 * Deja la base de datos al día SOLO si hace falta.
 *  - Caso normal: una lectura rápida de la versión y ya está (sin ningún bloqueo).
 *  - Si falta algo: una única instancia lo crea (candado), y solo lo que falta:
 *    nunca se repite una orden sobre algo que ya existe, porque ALTER TABLE exige un bloqueo
 *    exclusivo aunque no cambie nada, y con varias instancias a la vez eso cuelga la web.
 *  - Los bloqueos tienen tiempo máximo: si algo falla, falla rápido y se reintenta.
 */
async function ensureSchema(sql: postgres.Sql): Promise<void> {
  const has = (await sql.unsafe(`select to_regclass('public.${META}')::text as t`)) as unknown as { t: string | null }[];
  if (has[0]?.t) {
    const v = (await sql.unsafe(`select version from ${META} where id = 1`)) as unknown as { version: number }[];
    if ((v[0]?.version ?? 0) >= SCHEMA_VERSION) return;
  }

  await sql.begin(async (tx) => {
    await tx.unsafe("set local lock_timeout = '10s'");
    await tx.unsafe("set local statement_timeout = '30s'");
    await tx`select pg_advisory_xact_lock(727274)`;

    // otra instancia pudo terminar mientras esperábamos el candado
    const has2 = (await tx.unsafe(`select to_regclass('public.${META}')::text as t`)) as unknown as { t: string | null }[];
    if (has2[0]?.t) {
      const v2 = (await tx.unsafe(`select version from ${META} where id = 1`)) as unknown as { version: number }[];
      if ((v2[0]?.version ?? 0) >= SCHEMA_VERSION) return;
    }

    const tables = new Set((await rowsOf(tx, "select tablename as n from pg_tables where schemaname = 'public'")).map((r) => r.n));
    const cols = new Set((await rowsOf(tx, "select table_name || '.' || column_name as n from information_schema.columns where table_schema = 'public'")).map((r) => r.n));
    const idx = new Set((await rowsOf(tx, "select indexname as n from pg_indexes where schemaname = 'public'")).map((r) => r.n));
    const rls = new Set((await rowsOf(tx, "select tablename as n from pg_tables where schemaname = 'public' and rowsecurity")).map((r) => r.n));

    for (const [name, ddl] of TABLES) if (!tables.has(name)) await tx.unsafe(ddl);
    for (const [t, c, def] of COLUMNS) if (!cols.has(`${t}.${c}`)) await tx.unsafe(`ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS ${c} ${def}`);
    for (const [name, ddl] of INDEXES) if (!idx.has(name)) await tx.unsafe(ddl);

    if (!tables.has(META)) await tx.unsafe(`CREATE TABLE IF NOT EXISTS ${META}(id INTEGER PRIMARY KEY, version INTEGER NOT NULL)`);

    // Seguridad: Supabase expone por API las tablas del esquema public. Con RLS activado y sin
    // políticas, esa API no puede leer nada; nuestra app entra por conexión directa y no se ve afectada.
    for (const name of [...TABLES.map(([n]) => n), META]) {
      if (!rls.has(name)) await tx.unsafe(`ALTER TABLE ${name} ENABLE ROW LEVEL SECURITY`);
    }

    await tx.unsafe(
      `INSERT INTO ${META}(id, version) VALUES (1, ${SCHEMA_VERSION}) ON CONFLICT (id) DO UPDATE SET version = ${SCHEMA_VERSION}`,
    );
  });
}

/** Quita parámetros que otras herramientas añaden a la dirección y que el driver no entiende. */
function cleanUrl(u: string): string {
  try {
    const x = new URL(u);
    for (const k of ["supa", "pgbouncer", "connection_limit", "pool_timeout", "schema"]) x.searchParams.delete(k);
    return x.toString();
  } catch {
    return u;
  }
}

function make(): postgres.Sql {
  const url = cleanUrl(rawUrl());
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    // dirección mal formada: el driver dará el error
  }
  const local = host === "localhost" || host === "127.0.0.1";
  return postgres(url, {
    ssl: local ? false : "require",
    max: 2,
    prepare: false, // obligatorio con el pooler de Supabase (modo transacción)
    idle_timeout: 20,
    connect_timeout: 15,
    types: {
      bigint: { to: 20, from: [20], serialize: (x: unknown) => String(x), parse: (x: string) => Number(x) },
    },
  });
}

async function init(): Promise<postgres.Sql> {
  const sql = make();
  try {
    await ensureSchema(sql);
  } catch (e) {
    await sql.end({ timeout: 1 }).catch(() => {});
    throw e;
  }
  return sql;
}

type G = typeof globalThis & { __amx_sql?: Promise<postgres.Sql> };

export function db(): Promise<postgres.Sql> {
  if (!dbConfigured) return Promise.reject(new DbNotConfigured());
  const g = globalThis as G;
  if (!g.__amx_sql) {
    g.__amx_sql = init().catch((e) => {
      g.__amx_sql = undefined; // permite reintentar en la siguiente petición
      throw e;
    });
  }
  return g.__amx_sql;
}

export type Row = Record<string, string | number | null>;
export type Param = string | number | null;

/** Escribimos las consultas con `?`; Postgres usa $1, $2… */
const toPg = (text: string) => {
  let i = 0;
  return text.replace(/\?/g, () => `$${++i}`);
};

const QUERY_MS = 20_000;

/** Ejecuta una consulta con tiempo máximo: si la base no responde, falla en 20 s en vez de colgar la web. */
async function exec(text: string, args: Param[]) {
  const sql = await db();
  const pq = sql.unsafe(toPg(text), args as never[]);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      try {
        pq.cancel();
      } catch {
        // nada que cancelar
      }
      reject(new Error("La base de datos tarda demasiado en responder."));
    }, QUERY_MS);
  });
  Promise.resolve(pq).catch(() => {}); // si pierde la carrera, que no deje un error suelto
  try {
    return await Promise.race([pq, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export async function q<T = Row>(text: string, args: Param[] = []): Promise<T[]> {
  const rows = await exec(text, args);
  return rows.map((r) => ({ ...r })) as unknown as T[];
}

export async function q1<T = Row>(text: string, args: Param[] = []): Promise<T | null> {
  return (await q<T>(text, args))[0] ?? null;
}

/** Ejecuta una orden y devuelve cuántas filas cambió. */
export async function run(text: string, args: Param[] = []): Promise<number> {
  const r = await exec(text, args);
  return r.count ?? 0;
}
