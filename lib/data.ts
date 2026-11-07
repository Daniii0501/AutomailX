import "server-only";
import { ANIMALS, isAnimal } from "./animals";
import { eq, inList, one, select } from "./db";
import { isFormat, type FormatId } from "./formats";
import {
  EMPTY_CUSTOM,
  sanitizeNewsletter,
  writerFromRow,
  type CustomProfile,
  type Language,
  type Look,
  type Newsletter,
  type WriterProfile,
} from "./newsletter";
import { clean, int, isUuid } from "./util";

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
  writer_id: string | null;
  look: Look;
  brief: string;
  format: FormatId;
  content: Newsletter;
  warnings: string[];
  source: "ai" | "simulated";
  status: "draft" | "sending" | "sent";
  recipients: number;
  delivery: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
};

export async function getPublication(userId: string): Promise<Publication> {
  const p = await one<Publication>("publications", { user_id: eq(userId) });
  if (!p) throw new Error("Falta la publicación del usuario");
  return p;
}

export async function listWriters(userId: string): Promise<WriterProfile[]> {
  const rows = await select<Record<string, unknown>>("writers", { user_id: eq(userId), order: "created_at.asc" });
  return rows.map(writerFromRow);
}

export async function getWriter(userId: string, id: string | null | undefined): Promise<WriterProfile | null> {
  if (!isUuid(id)) return null;
  const r = await one<Record<string, unknown>>("writers", { id: eq(id), user_id: eq(userId) });
  return r ? writerFromRow(r) : null;
}

export async function getNewsletter(userId: string, id: string): Promise<NewsletterRow | null> {
  if (!isUuid(id)) return null;
  return one<NewsletterRow>("newsletters", { id: eq(id), user_id: eq(userId) });
}

export async function writersById(userId: string, ids: string[]): Promise<Map<string, WriterProfile>> {
  const valid = [...new Set(ids.filter(isUuid))];
  if (!valid.length) return new Map();
  const rows = await select<Record<string, unknown>>("writers", { user_id: eq(userId), id: inList(valid) });
  return new Map(rows.map((r) => [String(r.id), writerFromRow(r)]));
}

/** Valida lo que llega del formulario de redactor. Devuelve las columnas a guardar o un mensaje de error. */
export function parseWriter(b: Record<string, unknown>): Record<string, unknown> | string {
  const kind = b.kind === "custom" ? "custom" : "animal";
  const animal = isAnimal(b.animal) ? b.animal : "zorro";
  const name = clean(b.name, 40) || (kind === "animal" ? ANIMALS[animal].defaultName : "");
  if (name.length < 2) return "Ponle un nombre a tu redactor.";
  const length = b.length === "corto" || b.length === "largo" ? b.length : "medio";

  const c = (b.custom && typeof b.custom === "object" ? b.custom : {}) as Record<string, unknown>;
  const language: Language = c.language === "es-419" || c.language === "en" ? c.language : "es-ES";
  const custom: CustomProfile =
    kind === "custom"
      ? {
          voice: clean(c.voice, 600),
          audience: clean(c.audience, 400),
          dos: clean(c.dos, 600),
          donts: clean(c.donts, 600),
          phrases: clean(c.phrases, 400),
          greeting: clean(c.greeting, 120),
          signoff: clean(c.signoff, 80),
          humor: int(c.humor, 0, 100, 40),
          emotion: int(c.emotion, 0, 100, 50),
          language,
        }
      : { ...EMPTY_CUSTOM, language };

  if (kind === "custom" && custom.voice.length < 10) return "Describe en una frase cómo escribe tu redactor (su voz).";
  const color = typeof b.color === "string" && /^#[0-9a-f]{6}$/i.test(b.color) ? b.color : "";
  return {
    kind,
    animal,
    name,
    avatar: kind === "custom" ? clean(b.avatar, 8) || "✍️" : "",
    color: kind === "custom" ? color || "#6d4aff" : "",
    about: clean(b.about, 1200),
    formality: int(b.formality, 0, 100, 35),
    length,
    emojis: int(b.emojis, 0, 2, 1),
    sample: clean(b.sample, 3000),
    format: isFormat(b.format) ? b.format : "auto",
    custom,
  };
}

export function parseContent(x: unknown): Newsletter | null {
  return sanitizeNewsletter(x);
}

export type Account = { plan: "free" | "pro"; is_admin: boolean };

/** Plan y permisos del usuario. */
export async function getAccount(userId: string): Promise<Account> {
  const a = await one<Account>("users", { select: "plan,is_admin", id: eq(userId) });
  return { plan: a?.plan === "pro" ? "pro" : "free", is_admin: a?.is_admin === true };
}
