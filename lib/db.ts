import { createClient, type Client, type InValue } from "@libsql/client";
import { mkdirSync } from "node:fs";
import path from "node:path";

/**
 * Base de datos:
 *  - Con TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN): base de datos real y persistente.
 *  - Sin ella: archivo SQLite local (desarrollo) o /tmp (modo demo en Vercel, se puede borrar).
 */
export const isDemoDb = !process.env.TURSO_DATABASE_URL;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions(
  token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS login_tokens(
  token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, expires_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_email ON login_tokens(email, created_at);
CREATE TABLE IF NOT EXISTS publications(
  user_id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  sender_name TEXT NOT NULL, reply_to TEXT, cadence_day INTEGER, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS writers(
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, animal TEXT NOT NULL, name TEXT NOT NULL,
  about TEXT NOT NULL DEFAULT '', formality INTEGER NOT NULL DEFAULT 40,
  length TEXT NOT NULL DEFAULT 'medio', emojis INTEGER NOT NULL DEFAULT 1,
  sample TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_writers_user ON writers(user_id);
CREATE TABLE IF NOT EXISTS subscribers(
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, email TEXT NOT NULL, name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL, token TEXT UNIQUE NOT NULL, source TEXT NOT NULL DEFAULT 'manual',
  created_at INTEGER NOT NULL, UNIQUE(user_id, email)
);
CREATE TABLE IF NOT EXISTS newsletters(
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, writer_id TEXT NOT NULL, brief TEXT NOT NULL,
  content TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', delivery TEXT,
  recipients INTEGER NOT NULL DEFAULT 0, source TEXT NOT NULL DEFAULT 'simulated',
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, sent_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_news_user ON newsletters(user_id, created_at);
CREATE TABLE IF NOT EXISTS usage(
  key TEXT NOT NULL, day TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(key, day)
);
`;

type G = typeof globalThis & { __amx_db?: Promise<Client> };

function make(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  const dir = process.env.NODE_ENV === "production" ? "/tmp" : path.join(process.cwd(), "data");
  mkdirSync(dir, { recursive: true });
  return createClient({ url: `file:${path.join(dir, "automailx.db")}` });
}

async function init(): Promise<Client> {
  const c = make();
  await c.executeMultiple(SCHEMA);
  return c;
}

export function db(): Promise<Client> {
  const g = globalThis as G;
  g.__amx_db ??= init();
  return g.__amx_db;
}

export type Row = Record<string, string | number | null>;

export async function q<T = Row>(sql: string, args: InValue[] = []): Promise<T[]> {
  const c = await db();
  const r = await c.execute({ sql, args });
  return r.rows.map((row) =>
    Object.fromEntries(r.columns.map((col, i) => [col, row[i] as unknown])),
  ) as T[];
}

export async function q1<T = Row>(sql: string, args: InValue[] = []): Promise<T | null> {
  return (await q<T>(sql, args))[0] ?? null;
}

export async function run(sql: string, args: InValue[] = []): Promise<number> {
  const c = await db();
  return (await c.execute({ sql, args })).rowsAffected;
}
