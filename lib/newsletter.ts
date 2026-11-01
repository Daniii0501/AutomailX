import { ANIMALS, type AnimalId } from "./animals";

export type Newsletter = {
  subject: string;
  preheader: string;
  greeting: string;
  sections: { title: string; body: string }[];
  cta: string;
  ctaUrl?: string;
  signoff: string;
};

export type WriterProfile = {
  animal: AnimalId;
  name: string;
  about: string;
  formality: number; // 0 = muy cercano, 100 = muy formal
  length: "corto" | "medio" | "largo";
  emojis: number; // 0 ninguno, 1 algunos, 2 muchos
  sample: string;
};

export const SAMPLE_NOTE =
  "Esta semana lancé la nueva carta de otoño en la cafetería y la gente se ha vuelto loca con el café de especialidad de Etiopía. Cerramos el sábado por una boda. El viernes hacemos catas gratis a las seis. Quiero agradecer a los clientes de siempre y contar que abrimos una segunda terraza.";

const STRIP = /[\s,;:.!?¡¿]+$/g;

export function sentences(note: string): string[] {
  return note
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim().replace(STRIP, ""))
    .filter((s) => s.length > 8);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Recorta por palabra completa (o por coma si la frase es larga). */
export function shorten(s: string, max: number): string {
  if (s.length <= max) return s;
  const comma = s.indexOf(",");
  if (comma > 15 && comma <= max) return s.slice(0, comma);
  const cut = s.slice(0, max);
  const space = cut.lastIndexOf(" ");
  let out = (space > 15 ? cut.slice(0, space) : cut).replace(STRIP, "");
  // no terminar en una palabra suelta ("…en la cafetería y")
  out = out.replace(/\s+(y|e|o|u|de|del|la|el|los|las|en|con|que|a|un|una|por|para|al|se|su|sus)$/i, "");
  return out + "…";
}

/**
 * Generador simulado (sin clave de IA). Solo reordena lo que dijo el autor
 * con la personalidad del animal; no inventa datos.
 */
export function simulateNewsletter(note: string, w: WriterProfile): Newsletter {
  const a = ANIMALS[w.animal];
  const formal = w.formality >= 65 ? 1 : 0;
  const ss = sentences(note);
  const first = ss[0] ?? "Lo que ha pasado esta semana";
  const rest = ss.slice(1);
  const maxSections = w.length === "corto" ? 2 : w.length === "largo" ? 4 : 3;

  const emoji = w.emojis >= 1 ? ` ${a.emoji}` : "";
  const bodies = [first, ...rest];
  const per = Math.max(1, Math.ceil(bodies.length / maxSections));
  const groups: string[][] = [];
  for (let i = 0; i < bodies.length && groups.length < maxSections; i += per) {
    groups.push(bodies.slice(i, i + per));
  }

  return {
    subject: shorten(cap(first), 60) + (w.emojis >= 2 ? ` ${a.emoji}` : ""),
    preheader: shorten(rest[0] ? cap(rest[0]) : "Lo que tienes que saber esta semana", 90),
    greeting: a.greet[formal] + (formal ? "" : emoji),
    sections: groups.map((g, i) => ({
      title: a.headings[i] ?? a.headings[a.headings.length - 1],
      body: g.map((s) => `${cap(s)}.`).join(" "),
    })),
    cta: a.cta[formal],
    signoff: a.sign[formal],
  };
}

/** Revisión simulada: entiende unas pocas órdenes sencillas. */
export function simulateRevision(n: Newsletter, instruction: string, w: WriterProfile): Newsletter {
  const a = ANIMALS[w.animal];
  const t = instruction.toLowerCase();
  const out: Newsletter = JSON.parse(JSON.stringify(n));

  if (/(corto|breve|resum|menos)/.test(t)) {
    out.sections = out.sections.slice(0, 2).map((s) => ({
      ...s,
      body: s.body.split(/(?<=[.!?])\s+/).slice(0, 1).join(" "),
    }));
  }
  if (/formal|profesional|serio/.test(t)) {
    out.greeting = a.greet[1];
    out.signoff = a.sign[1];
    out.cta = a.cta[1];
    out.greeting = out.greeting.replace(a.emoji, "").trim();
  }
  if (/cercan|informal|divert|amig|simp[aá]tic/.test(t)) {
    out.greeting = a.greet[0] + ` ${a.emoji}`;
    out.signoff = a.sign[0];
    out.cta = a.cta[0];
  }
  if (/emoji/.test(t) && !out.subject.includes(a.emoji)) out.subject = `${out.subject} ${a.emoji}`;
  if (/(llamada|acci[oó]n|bot[oó]n)/.test(t)) out.cta = a.cta[w.formality >= 65 ? 1 : 0];
  return out;
}

export function flatten(n: Newsletter): { kind: string; text: string }[] {
  return [
    { kind: "subject", text: n.subject },
    { kind: "preheader", text: n.preheader },
    { kind: "greeting", text: n.greeting },
    ...n.sections.flatMap((s) => [
      { kind: "h", text: s.title },
      { kind: "p", text: s.body },
    ]),
    { kind: "cta", text: n.cta },
    { kind: "signoff", text: n.signoff },
  ];
}

const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const str = (x: unknown, max: number) => (typeof x === "string" ? x.replace(CTRL, "").trim().slice(0, max) : "");

/** Valida y limpia una newsletter (salida de la IA o datos del usuario). */
export function sanitizeNewsletter(x: unknown): Newsletter | null {
  if (!x || typeof x !== "object") return null;
  const n = x as Record<string, unknown>;
  const sectionsIn = Array.isArray(n.sections) ? n.sections.slice(0, 8) : [];
  const sections = sectionsIn
    .map((s) => {
      const o = (s ?? {}) as Record<string, unknown>;
      return { title: str(o.title, 80), body: str(o.body, 2000) };
    })
    .filter((s) => s.body.length > 0);
  const subject = str(n.subject, 120);
  if (!subject || sections.length === 0) return null;

  let ctaUrl: string | undefined;
  const rawUrl = str(n.ctaUrl, 500);
  if (rawUrl) {
    try {
      const u = new URL(rawUrl);
      if (u.protocol === "http:" || u.protocol === "https:") ctaUrl = u.toString();
    } catch {
      ctaUrl = undefined;
    }
  }

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
