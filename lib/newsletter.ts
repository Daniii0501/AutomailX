import { ANIMALS, isAnimal, type AnimalId } from "./animals";
import { isFormat, type FormatId } from "./formats";

export type Section = { title: string; body: string };

export type Newsletter = {
  subject: string;
  preheader: string;
  greeting: string;
  sections: Section[];
  cta: string;
  ctaUrl?: string;
  signoff: string;
};

export type Language = "es-ES" | "es-419" | "en";

export type CustomProfile = {
  voice: string;
  audience: string;
  dos: string;
  donts: string;
  phrases: string;
  greeting: string;
  signoff: string;
  humor: number;
  emotion: number;
  language: Language;
};

export const EMPTY_CUSTOM: CustomProfile = {
  voice: "",
  audience: "",
  dos: "",
  donts: "",
  phrases: "",
  greeting: "",
  signoff: "",
  humor: 40,
  emotion: 50,
  language: "es-ES",
};

export type Length = "corto" | "medio" | "largo";

export type WriterProfile = {
  id?: string;
  kind: "animal" | "custom";
  animal: AnimalId;
  name: string;
  avatar: string;
  color: string;
  about: string;
  formality: number;
  length: Length;
  emojis: number;
  sample: string;
  format: FormatId;
  custom: CustomProfile;
};

/** Aspecto visual de un redactor: lo que se ve en el panel y en el correo. */
export type Look = { emoji: string; color: string; name: string; animal: AnimalId | null };

export function lookOf(w: Pick<WriterProfile, "kind" | "animal" | "avatar" | "color" | "name">): Look {
  const a = ANIMALS[w.animal] ?? ANIMALS.zorro;
  if (w.kind === "custom") return { emoji: w.avatar || "✍️", color: w.color || "#6d4aff", name: w.name, animal: null };
  return { emoji: a.emoji, color: a.color, name: w.name, animal: a.id };
}

export const DEFAULT_LOOK: Look = { emoji: "✉️", color: "#6d4aff", name: "AutoMailX", animal: null };

/** Fila de la tabla writers -> perfil. */
export function writerFromRow(r: Record<string, unknown>): WriterProfile {
  const c = (r.custom && typeof r.custom === "object" ? r.custom : {}) as Partial<CustomProfile>;
  return {
    id: String(r.id),
    kind: r.kind === "custom" ? "custom" : "animal",
    animal: isAnimal(r.animal) ? r.animal : "zorro",
    name: String(r.name ?? ""),
    avatar: String(r.avatar ?? ""),
    color: String(r.color ?? ""),
    about: String(r.about ?? ""),
    formality: Number(r.formality ?? 35),
    length: r.length === "corto" || r.length === "largo" ? r.length : "medio",
    emojis: Number(r.emojis ?? 1),
    sample: String(r.sample ?? ""),
    format: isFormat(r.format) ? r.format : "auto",
    custom: { ...EMPTY_CUSTOM, ...c },
  };
}

export const SAMPLE_NOTE =
  "Esta semana lancé la nueva carta de otoño en la cafetería y la gente se ha vuelto loca con el café de especialidad de Etiopía. Cerramos el sábado por una boda. El viernes hacemos catas gratis a las seis. Quiero agradecer a los clientes de siempre y contar que abrimos una segunda terraza.";

// ---------------- Saneado ----------------

const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const str = (x: unknown, max: number) => (typeof x === "string" ? x.replace(CTRL, "").trim().slice(0, max) : "");

export function safeUrl(raw: unknown): string | undefined {
  const s = str(raw, 500);
  if (!s) return undefined;
  try {
    const u = new URL(/^[a-z]+:/i.test(s) ? s : `https://${s}`);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
  } catch {
    /* no es una URL */
  }
  return undefined;
}

/** Valida y limpia una newsletter (salida de la IA o datos del usuario). */
export function sanitizeNewsletter(x: unknown): Newsletter | null {
  if (!x || typeof x !== "object") return null;
  const n = x as Record<string, unknown>;
  const sectionsIn = Array.isArray(n.sections) ? n.sections.slice(0, 8) : [];
  const sections = sectionsIn
    .map((s) => {
      const o = (s ?? {}) as Record<string, unknown>;
      return { title: str(o.title, 80), body: str(o.body, 4000) };
    })
    .filter((s) => s.body.length > 0);
  const subject = str(n.subject, 120);
  if (!subject || sections.length === 0) return null;
  const ctaUrl = safeUrl(n.ctaUrl);
  return {
    subject,
    preheader: str(n.preheader, 160),
    greeting: str(n.greeting, 200),
    sections,
    cta: str(n.cta, 80),
    ...(ctaUrl ? { ctaUrl } : {}),
    signoff: str(n.signoff, 80),
  };
}

// ---------------- Modo simulado (sin clave de IA) ----------------

const STRIP = /[\s,;:.!?¡¿]+$/g;

export function sentences(note: string): string[] {
  return note
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim().replace(STRIP, ""))
    .filter((s) => s.length > 8);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function shorten(s: string, max: number): string {
  if (s.length <= max) return s;
  const comma = s.indexOf(",");
  if (comma > 15 && comma <= max) return s.slice(0, comma);
  const cut = s.slice(0, max);
  const space = cut.lastIndexOf(" ");
  let out = (space > 15 ? cut.slice(0, space) : cut).replace(STRIP, "");
  out = out.replace(/\s+(y|e|o|u|de|del|la|el|los|las|en|con|que|a|un|una|por|para|al|se|su|sus)$/i, "");
  return out + "…";
}

/** Solo reordena lo que dijo el autor con la personalidad del redactor. No inventa datos. */
export function simulateNewsletter(note: string, w: WriterProfile): Newsletter {
  const a = ANIMALS[w.animal];
  const formal = w.formality >= 65 ? 1 : 0;
  const ss = sentences(note);
  const first = ss[0] ?? "Lo que ha pasado esta semana";
  const rest = ss.slice(1);
  const maxSections = w.length === "corto" ? 2 : w.length === "largo" ? 4 : 3;
  const emoji = w.emojis >= 1 ? ` ${lookOf(w).emoji}` : "";
  const bodies = [first, ...rest];
  const per = Math.max(1, Math.ceil(bodies.length / maxSections));
  const groups: string[][] = [];
  for (let i = 0; i < bodies.length && groups.length < maxSections; i += per) groups.push(bodies.slice(i, i + per));
  const own = w.kind === "custom" ? w.custom : null;
  return {
    subject: shorten(cap(first), 60),
    preheader: shorten(rest[0] ? cap(rest[0]) : "Lo que tienes que saber esta semana", 90),
    greeting: own?.greeting || a.greet[formal] + (formal ? "" : emoji),
    sections: groups.map((g, i) => ({
      title: a.headings[i] ?? a.headings[a.headings.length - 1],
      body: g.map((s) => `${cap(s)}.`).join(" "),
    })),
    cta: a.cta[formal],
    signoff: own?.signoff || a.sign[formal],
  };
}

export function simulateRevision(n: Newsletter, instruction: string, w: WriterProfile): Newsletter {
  const a = ANIMALS[w.animal];
  const t = instruction.toLowerCase();
  const out: Newsletter = structuredClone(n);
  if (/(corto|breve|resum|menos)/.test(t)) {
    out.sections = out.sections.slice(0, 2).map((s) => ({ ...s, body: s.body.split(/(?<=[.!?])\s+/).slice(0, 1).join(" ") }));
  }
  if (/formal|profesional|serio/.test(t)) {
    out.greeting = a.greet[1];
    out.signoff = a.sign[1];
    out.cta = a.cta[1];
  }
  if (/cercan|informal|divert|amig|simp[aá]tic/.test(t)) {
    out.greeting = a.greet[0];
    out.signoff = a.sign[0];
    out.cta = a.cta[0];
  }
  return out;
}

/** Texto plano de toda la pieza (para comprobar cifras). */
export function textOf(n: Newsletter): string {
  return [n.subject, n.preheader, n.greeting, ...n.sections.flatMap((s) => [s.title, s.body]), n.cta, n.signoff].join("\n");
}
