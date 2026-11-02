import { isAnimal, type AnimalId } from "./animals";
import { q, q1 } from "./db";
import { isFormat, type FormatId } from "./formats";
import type { Newsletter, WriterProfile } from "./newsletter";
import { EMPTY_CUSTOM, sanitizeNewsletter, type CustomProfile } from "./newsletter";

export type Writer = WriterProfile & { id: string; user_id: string; created_at: number };

export type Publication = {
  user_id: string;
  slug: string;
  name: string;
  sender_name: string;
  reply_to: string | null;
  cadence_day: number | null;
};

export type NewsletterRow = {
  id: string;
  user_id: string;
  writer_id: string;
  brief: string;
  content: Newsletter;
  status: "draft" | "sending" | "sent";
  delivery: string | null;
  recipients: number;
  source: string;
  format: string;
  created_at: number;
  updated_at: number;
  sent_at: number | null;
};

export type Subscriber = {
  id: string;
  user_id: string;
  email: string;
  name: string;
  status: "pending" | "confirmed" | "unsubscribed";
  token: string;
  source: string;
  created_at: number;
};

type RawWriter = {
  id: string;
  user_id: string;
  animal: string;
  name: string;
  about: string;
  formality: number;
  length: string;
  emojis: number;
  sample: string;
  created_at: number;
  kind: string;
  avatar: string;
  color: string;
  profile: string;
  format: string;
};

function parseCustom(raw: string): CustomProfile {
  try {
    const o = JSON.parse(raw) as Partial<CustomProfile>;
    const s = (x: unknown) => (typeof x === "string" ? x : "");
    const n = (x: unknown, d: number) => (typeof x === "number" && Number.isFinite(x) ? Math.max(0, Math.min(100, x)) : d);
    return {
      voice: s(o.voice),
      audience: s(o.audience),
      dos: s(o.dos),
      donts: s(o.donts),
      phrases: s(o.phrases),
      greeting: s(o.greeting),
      signoff: s(o.signoff),
      humor: n(o.humor, EMPTY_CUSTOM.humor),
      emotion: n(o.emotion, EMPTY_CUSTOM.emotion),
      language: o.language === "es-419" || o.language === "en" ? o.language : "es-ES",
    };
  } catch {
    return { ...EMPTY_CUSTOM };
  }
}

function toWriter(r: RawWriter): Writer {
  return {
    id: r.id,
    user_id: r.user_id,
    kind: r.kind === "custom" ? "custom" : "animal",
    animal: (isAnimal(r.animal) ? r.animal : "zorro") as AnimalId,
    name: r.name,
    about: r.about,
    formality: r.formality,
    length: (["corto", "medio", "largo"].includes(r.length) ? r.length : "medio") as Writer["length"],
    emojis: r.emojis,
    sample: r.sample,
    format: (isFormat(r.format) ? r.format : "auto") as FormatId,
    avatar: r.avatar ?? "",
    color: r.color ?? "",
    custom: parseCustom(r.profile ?? "{}"),
    created_at: r.created_at,
  };
}

export async function getWriters(userId: string): Promise<Writer[]> {
  const rows = await q<RawWriter>("SELECT * FROM writers WHERE user_id = ? ORDER BY created_at", [userId]);
  return rows.map(toWriter);
}

export async function getWriter(userId: string, id: string): Promise<Writer | null> {
  const r = await q1<RawWriter>("SELECT * FROM writers WHERE id = ? AND user_id = ?", [id, userId]);
  return r ? toWriter(r) : null;
}

export async function getPublication(userId: string): Promise<Publication> {
  const p = await q1<Publication>("SELECT * FROM publications WHERE user_id = ?", [userId]);
  if (!p) throw new Error("Publicación no encontrada");
  return p;
}

type RawNewsletter = Omit<NewsletterRow, "content"> & { content: string };

function toNewsletter(r: RawNewsletter): NewsletterRow | null {
  let content: Newsletter | null = null;
  try {
    content = sanitizeNewsletter(JSON.parse(r.content));
  } catch {
    content = null;
  }
  return content ? { ...r, content } : null;
}

export async function getNewsletter(userId: string, id: string): Promise<NewsletterRow | null> {
  const r = await q1<RawNewsletter>("SELECT * FROM newsletters WHERE id = ? AND user_id = ?", [id, userId]);
  return r ? toNewsletter(r) : null;
}

export async function listNewsletters(userId: string, limit = 50): Promise<NewsletterRow[]> {
  const rows = await q<RawNewsletter>(
    "SELECT * FROM newsletters WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    [userId, limit],
  );
  return rows.map(toNewsletter).filter((x): x is NewsletterRow => x !== null);
}

export async function listSubscribers(userId: string): Promise<Subscriber[]> {
  return q<Subscriber>("SELECT * FROM subscribers WHERE user_id = ? ORDER BY created_at DESC", [userId]);
}

export async function countConfirmed(userId: string): Promise<number> {
  const r = await q1<{ n: number }>(
    "SELECT COUNT(*) AS n FROM subscribers WHERE user_id = ? AND status = 'confirmed'",
    [userId],
  );
  return r?.n ?? 0;
}

export async function countSubscribers(userId: string): Promise<number> {
  const r = await q1<{ n: number }>(
    "SELECT COUNT(*) AS n FROM subscribers WHERE user_id = ? AND status != 'unsubscribed'",
    [userId],
  );
  return r?.n ?? 0;
}
