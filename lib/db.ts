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
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, created_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions(
  token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS login_tokens(
  token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, expires_at BIGINT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0, created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_email ON login_tokens(email, created_at);
CREATE TABLE IF NOT EXISTS publications(
  user_id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  sender_name TEXT NOT NULL, reply_to TEXT, cadence_day INTEGER, created_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS writers(
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, animal TEXT NOT NULL, name TEXT NOT NULL,
  about TEXT NOT NULL DEFAULT '', formality INTEGER NOT NULL DEFAULT 40,
  length TEXT NOT NULL DEFAULT 'medio', emojis INTEGER NOT NULL DEFAULT 1,
  sample TEXT NOT NULL DEFAULT '', created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_writers_user ON writers(user_id);
CREATE TABLE IF NOT EXISTS subscribers(
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, email TEXT NOT NULL, name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL, token TEXT UNIQUE NOT NULL, source TEXT NOT NULL DEFAULT 'manual',
  created_at BIGINT NOT NULL, UNIQUE(user_id, email)
);
CREATE TABLE IF NOT EXISTS newsletters(
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, writer_id TEXT NOT NULL, brief TEXT NOT NULL,
  content TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', delivery TEXT,
  recipients INTEGER NOT NULL DEFAULT 0, source TEXT NOT NULL DEFAULT 'simulated',
  created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL, sent_at BIGINT
);
CREATE INDEX IF NOT EXISTS idx_news_user ON newsletters(user_id, created_at);
CREATE TABLE IF NOT EXISTS usage(
  key TEXT NOT NULL, day TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(key, day)
);

-- Redactores a medida y estilos de copy
ALTER TABLE writers ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'animal';
ALTER TABLE writers ADD COLUMN IF NOT EXISTS avatar TEXT NOT NULL DEFAULT '';
ALTER TABLE writers ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '';
ALTER TABLE writers ADD COLUMN IF NOT EXISTS profile TEXT NOT NULL DEFAULT '{}';
ALTER TABLE writers ADD COLUMN IF NOT EXISTS format TEXT NOT NULL DEFAULT 'auto';
ALTER TABLE newsletters ADD COLUMN IF NOT EXISTS format TEXT NOT NULL DEFAULT 'auto';

-- Temas: banco de ideas y programación por día
CREATE TABLE IF NOT EXISTS topics(
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, writer_id TEXT NOT NULL, title TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '', format TEXT NOT NULL DEFAULT 'auto', scheduled_day TEXT,
  mode TEXT NOT NULL DEFAULT 'draft', status TEXT NOT NULL DEFAULT 'idea',
  newsletter_id TEXT, error TEXT, created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_topics_user ON topics(user_id, scheduled_day);

-- Seguridad: Supabase expone por API las tablas del esquema public. Con RLS activado y sin
-- políticas, esa API no puede leer nada; nuestra app entra por conexión directa y no se ve afectada.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE writers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
`;

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
    max: 3,
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
    // Un candado evita que dos instancias nuevas creen las tablas a la vez.
    await sql.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(727274)`;
      await tx.unsafe(SCHEMA);
    });
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

export async function q<T = Row>(text: string, args: Param[] = []): Promise<T[]> {
  const sql = await db();
  const rows = await sql.unsafe(toPg(text), args as never[]);
  return rows.map((r) => ({ ...r })) as unknown as T[];
}

export async function q1<T = Row>(text: string, args: Param[] = []): Promise<T | null> {
  return (await q<T>(text, args))[0] ?? null;
}

/** Ejecuta una orden y devuelve cuántas filas cambió. */
export async function run(text: string, args: Param[] = []): Promise<number> {
  const sql = await db();
  const r = await sql.unsafe(toPg(text), args as never[]);
  return r.count ?? 0;
}
