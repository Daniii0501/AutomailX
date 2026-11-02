import { ANIMALS } from "./animals";
import { COPY_BIBLE, FORMATS, type FormatId } from "./formats";
import {
  sanitizeNewsletter,
  simulateNewsletter,
  simulateRevision,
  type Newsletter,
  type WriterProfile,
} from "./newsletter";

export const aiEnabled = () => !!process.env.ANTHROPIC_API_KEY;
/** Segundo pase de "editor jefe". Se puede apagar con AI_POLISH=0 para gastar menos. */
const polishEnabled = () => process.env.AI_POLISH !== "0";

const LANG: Record<string, string> = {
  "es-ES": "español de España",
  "es-419": "español latinoamericano neutro",
  en: "English (natural and idiomatic)",
};

const level = (n: number, low: string, mid: string, high: string) => (n <= 30 ? low : n >= 70 ? high : mid);

/** La personalidad y las reglas propias del redactor (animal o a medida). */
export function personaBlock(w: WriterProfile): string {
  const a = ANIMALS[w.animal];
  const c = w.custom;
  const L: string[] = [];

  if (w.kind === "custom") {
    L.push(`TU IDENTIDAD: te llamas «${w.name}» y eres el copywriter personal de la persona que te contrata. Escribes en primera persona, en su nombre.`);
    L.push(`Tu voz: ${c.voice.trim() || "natural, cercana y cuidada"}.`);
    if (c.audience.trim()) L.push(`Quién lee: ${c.audience.trim()}. Escribe pensando en esa persona.`);
    if (c.dos.trim()) L.push(`SIEMPRE haz esto: ${c.dos.trim()}`);
    if (c.donts.trim()) L.push(`NUNCA hagas esto ni uses estas palabras: ${c.donts.trim()}`);
    if (c.phrases.trim()) L.push(`Expresiones propias que puedes usar con naturalidad (sin abusar): ${c.phrases.trim()}`);
    if (c.greeting.trim()) L.push(`El campo "greeting" debe ser exactamente: «${c.greeting.trim()}»`);
    if (c.signoff.trim()) L.push(`El campo "signoff" debe ser exactamente: «${c.signoff.trim()}»`);
    L.push(`Humor: ${level(c.humor, "serio, sin bromas", "una chispa de humor cuando venga a cuento", "muy gracioso, con ingenio constante")}.`);
    L.push(`Emoción: ${level(c.emotion, "racional y sobrio", "equilibrado entre cabeza y corazón", "muy emotivo y cercano al corazón")}.`);
  } else {
    L.push(`TU IDENTIDAD: te llamas «${w.name}», redactor de newsletters con alma de ${a.species.toLowerCase()}. Personalidad: ${a.voice}.`);
    L.push("Escribes en primera persona, en nombre de la persona que te contrata.");
  }

  L.push(`Idioma: ${LANG[c.language] ?? LANG["es-ES"]}.`);
  L.push(
    `Registro: ${w.formality >= 65 ? "formal y respetuoso" : w.formality <= 30 ? "muy cercano e informal (tuteo)" : "cercano pero cuidado (tuteo)"}.`,
  );
  L.push(
    `Longitud: ${
      w.length === "corto"
        ? "corta (1 o 2 secciones de 1 a 3 frases)"
        : w.length === "largo"
          ? "larga (3 a 5 secciones, con desarrollo)"
          : "media (2 o 3 secciones)"
    }.`,
  );
  L.push(`Emojis: ${w.emojis === 0 ? "ninguno" : w.emojis >= 2 ? "con alegría, pero con sentido" : "alguno suelto, solo si suma"}.`);
  if (w.about.trim()) L.push(`Sobre el autor o su negocio (contexto): ${w.about.trim().slice(0, 1200)}`);
  if (w.sample.trim()) {
    L.push(`Imita el estilo de este texto del autor (ritmo, vocabulario, forma de abrir y cerrar), sin copiar su contenido:\n"""\n${w.sample.trim().slice(0, 3000)}\n"""`);
  }
  return L.join("\n");
}

function formatBlock(f: FormatId): string {
  const F = FORMATS[f] ?? FORMATS.auto;
  return `ESTILO ELEGIDO PARA ESTA PIEZA: ${F.label}\n${F.brief}`;
}

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function callClaude(
  system: string,
  user: string,
  opts: { maxTokens: number; temperature: number; timeoutMs: number },
): Promise<Newsletter> {
  const res = await fetch(process.env.ANTHROPIC_API_URL ?? "https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
      system,
      messages: [{ role: "user", content: user }],
    }),
    signal: AbortSignal.timeout(opts.timeoutMs),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = data.content?.find((c) => c.type === "text")?.text ?? "";
  const n = sanitizeNewsletter(extractJson(text));
  if (!n) throw new Error("Respuesta no válida");
  return n;
}

// ---------------- Comprobación de cifras inventadas ----------------

const numsOf = (s: string) => (s.match(/\d+(?:[.,]\d+)?/g) ?? []).map((x) => x.replace(",", "."));

function textOf(n: Newsletter): string {
  return [n.subject, n.preheader, n.greeting, ...n.sections.flatMap((s) => [s.title, s.body]), n.cta, n.signoff].join("\n");
}

/** Cifras que aparecen en el texto pero no en las notas del autor (salvo numeración 1 a 5). */
export function suspiciousNumbers(brief: string, n: Newsletter): string[] {
  const known = new Set(numsOf(brief));
  const out = new Set<string>();
  for (const x of numsOf(textOf(n))) {
    if (known.has(x)) continue;
    if (/^[1-5]$/.test(x)) continue;
    out.add(x);
  }
  return [...out];
}

// ---------------- Redactar ----------------

const SHAPE = `{"plan": {"angulo": string, "gancho": string, "estructura": string}, "subject": string, "preheader": string, "greeting": string, "sections": [{"title": string, "body": string}], "cta": string, "signoff": string}`;

const EDITOR = `AHORA ACTÚAS COMO EDITOR JEFE DE COPY. Recibes el borrador de un redactor y las notas originales del autor. Tu trabajo: llevarlo de bueno a excelente SIN cambiar los hechos.
Revisa y corrige:
1. Asunto: ¿es específico, con curiosidad o beneficio, y mide entre 25 y 55 caracteres? Mejóralo si no.
2. Apertura: ¿la primera línea engancha de verdad? Si es genérica, reescríbela.
3. Elimina cualquier cliché de la lista de prohibidos y cualquier frase de relleno.
4. Elimina todo dato que no esté en las notas (cifras, nombres, resultados, citas, fechas).
5. Ritmo: alterna frases cortas y largas; párrafos de 1 a 3 frases.
6. Mantén la voz del redactor y el estilo elegido. Una sola llamada a la acción clara.
Si algo ya está bien, no lo toques. No alargues: si se puede decir con menos, mejor.
Devuelve el JSON completo con la misma forma que el borrador (sin "plan").`;

export type Written = { newsletter: Newsletter; source: "claude" | "simulated" };

export async function writeNewsletter(
  brief: string,
  w: WriterProfile,
  format?: FormatId,
): Promise<Written> {
  if (aiEnabled()) {
    try {
      const fmt = format && format !== "auto" ? format : w.format;
      const system = [COPY_BIBLE, formatBlock(fmt), personaBlock(w)].join("\n\n");
      const user = `NOTAS DEL AUTOR (única fuente de hechos):\n"""\n${brief.slice(0, 4000)}\n"""\n\nAntes de escribir, decide en "plan" el ángulo que hace especial esta pieza, el gancho de apertura y la estructura. Después escribe la pieza completa.\nDevuelve este JSON: ${SHAPE}`;

      let n = await callClaude(system, user, { maxTokens: 2200, temperature: 0.9, timeoutMs: 55_000 });

      if (polishEnabled()) {
        try {
          const sus = suspiciousNumbers(brief, n);
          const polishUser = `NOTAS ORIGINALES DEL AUTOR:\n"""\n${brief.slice(0, 4000)}\n"""\n\nBORRADOR A MEJORAR (JSON):\n${JSON.stringify(n)}${
            sus.length ? `\n\nATENCIÓN: estas cifras NO aparecen en las notas y hay que quitarlas o sustituirlas por algo cierto: ${sus.join(", ")}.` : ""
          }`;
          n = await callClaude(`${system}\n\n${EDITOR}`, polishUser, { maxTokens: 2200, temperature: 0.5, timeoutMs: 40_000 });
        } catch {
          // si el editor falla, nos quedamos con el borrador del redactor
        }
      }
      return { newsletter: n, source: "claude" };
    } catch {
      // caemos al modo simulado para no dejar al usuario sin resultado
    }
  }
  return { newsletter: simulateNewsletter(brief, w), source: "simulated" };
}

export async function reviseNewsletter(
  current: Newsletter,
  instruction: string,
  w: WriterProfile,
  brief = "",
): Promise<Written> {
  if (aiEnabled()) {
    try {
      const system = [COPY_BIBLE, formatBlock(w.format), personaBlock(w)].join("\n\n");
      const user = `${brief ? `NOTAS ORIGINALES DEL AUTOR (única fuente de hechos):\n"""\n${brief.slice(0, 4000)}\n"""\n\n` : ""}Esta es la newsletter actual (JSON):\n${JSON.stringify(current)}\n\nEl autor te pide este cambio: «${instruction.slice(0, 500)}»\n\nAplícalo con oficio y devuelve la newsletter COMPLETA modificada, con la misma forma JSON (sin "plan"). Mantén lo que no te pida cambiar. No inventes datos nuevos.`;
      const n = await callClaude(system, user, { maxTokens: 2200, temperature: 0.8, timeoutMs: 55_000 });
      if (current.ctaUrl && !n.ctaUrl) n.ctaUrl = current.ctaUrl;
      return { newsletter: n, source: "claude" };
    } catch {
      // modo simulado
    }
  }
  return { newsletter: simulateRevision(current, instruction, w), source: "simulated" };
}
