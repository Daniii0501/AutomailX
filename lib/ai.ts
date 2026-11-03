import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { ANIMALS } from "./animals";
import { COPY_BIBLE, FORMATS, type FormatId } from "./formats";
import {
  sanitizeNewsletter,
  simulateNewsletter,
  simulateRevision,
  textOf,
  type Newsletter,
  type WriterProfile,
} from "./newsletter";

/**
 * Proveedor de IA: Claude (Anthropic) si hay ANTHROPIC_API_KEY; si no, OpenAI si hay OPENAI_API_KEY.
 * Para cambiar de uno a otro basta con poner o quitar la clave en Vercel.
 */
export type Provider = "anthropic" | "openai";
export function provider(): Provider | null {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}
export const aiEnabled = () => provider() !== null;
export const aiLabel = () => {
  const p = provider();
  return p === "anthropic" ? `Claude (${ANTHROPIC_MODEL()})` : p === "openai" ? `OpenAI (${OPENAI_MODEL()})` : null;
};
/** Segundo pase de "editor jefe". AI_POLISH=0 lo apaga (gasta menos, escribe peor). */
const polishEnabled = () => process.env.AI_POLISH !== "0";
const ANTHROPIC_MODEL = () => process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
const OPENAI_MODEL = () => process.env.OPENAI_MODEL || "gpt-5.4-mini";

let _anthropic: Anthropic | null = null;
const anthropic = () => (_anthropic ??= new Anthropic({ maxRetries: 1 }));
let _openai: OpenAI | null = null;
const openai = () => (_openai ??= new OpenAI({ maxRetries: 1 }));

// ---------------- Forma de la respuesta (validada por la API) ----------------

const SectionSchema = z.object({ title: z.string(), body: z.string() });
const PieceFields = {
  subject: z.string(),
  preheader: z.string(),
  greeting: z.string(),
  sections: z.array(SectionSchema),
  cta: z.string(),
  signoff: z.string(),
};
const DraftSchema = z.object({
  plan: z.object({ angulo: z.string(), gancho: z.string(), estructura: z.string() }),
  ...PieceFields,
});
const PieceSchema = z.object(PieceFields);

// ---------------- Prompts ----------------

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

const EDITOR = `AHORA ACTÚAS COMO EDITOR JEFE DE COPY. Recibes el borrador de un redactor y las notas originales del autor. Tu trabajo: llevarlo de bueno a excelente SIN cambiar los hechos.
Revisa y corrige:
1. Asunto: ¿es específico, con curiosidad o beneficio, y mide entre 25 y 55 caracteres? Mejóralo si no.
2. Apertura: ¿la primera línea engancha de verdad? Si es genérica, reescríbela.
3. Elimina cualquier cliché de la lista de prohibidos y cualquier frase de relleno.
4. Elimina todo dato que no esté en las notas (cifras, nombres, resultados, citas, fechas).
5. Ritmo: alterna frases cortas y largas; párrafos de 1 a 3 frases.
6. Mantén la voz del redactor y el estilo elegido. Una sola llamada a la acción clara.
Si algo ya está bien, no lo toques. No alargues: si se puede decir con menos, mejor.
Devuelve la pieza completa con la misma forma que el borrador.`;

// ---------------- Llamada al modelo ----------------

type Effort = "low" | "medium" | "high";
type CallOpts = { effort: Effort; timeoutMs: number };

/** Pide la pieza al proveedor activo y devuelve el JSON ya validado con el esquema. */
async function callModel<S extends z.ZodType>(schema: S, system: string, user: string, opts: CallOpts): Promise<z.infer<S>> {
  return provider() === "openai" ? callOpenAI(schema, system, user, opts) : callClaude(schema, system, user, opts);
}

async function callOpenAI<S extends z.ZodType>(schema: S, system: string, user: string, opts: CallOpts): Promise<z.infer<S>> {
  const res = await openai().responses.parse(
    {
      model: OPENAI_MODEL(),
      max_output_tokens: 16000,
      reasoning: { effort: opts.effort },
      instructions: system,
      input: user,
      text: { format: zodTextFormat(schema, "newsletter") },
    },
    { timeout: opts.timeoutMs },
  );
  const refused = res.output.some((o) => o.type === "message" && o.content.some((c) => c.type === "refusal"));
  if (refused) throw new Error("El modelo no ha querido escribir este texto.");
  if (res.status === "incomplete") throw new Error("La respuesta se ha cortado.");
  if (!res.output_parsed) throw new Error("Respuesta no válida");
  return res.output_parsed as z.infer<S>;
}

async function callClaude<S extends z.ZodType>(schema: S, system: string, user: string, opts: CallOpts): Promise<z.infer<S>> {
  const res = await anthropic().beta.messages.parse(
    {
      model: ANTHROPIC_MODEL(),
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: opts.effort, format: betaZodOutputFormat(schema) },
      system,
      messages: [{ role: "user", content: user }],
    },
    { timeout: opts.timeoutMs },
  );
  if (res.stop_reason === "refusal") throw new Error("El modelo no ha querido escribir este texto.");
  if (res.stop_reason === "max_tokens") throw new Error("La respuesta se ha cortado.");
  if (!res.parsed_output) throw new Error("Respuesta no válida");
  return res.parsed_output as z.infer<S>;
}

const toNewsletter = (x: unknown): Newsletter => {
  const n = sanitizeNewsletter(x);
  if (!n) throw new Error("Respuesta incompleta");
  return n;
};

// ---------------- Comprobación de cifras inventadas ----------------

const numsOf = (s: string) => (s.match(/\d+(?:[.,]\d+)?/g) ?? []).map((x) => x.replace(",", "."));

/** Cifras que aparecen en el texto pero no en las notas del autor (salvo numeración 1 a 5). */
export function suspiciousNumbers(brief: string, n: Newsletter): string[] {
  const known = new Set(numsOf(brief));
  const out = new Set<string>();
  for (const x of numsOf(textOf(n))) {
    if (known.has(x) || /^[1-5]$/.test(x)) continue;
    out.add(x);
  }
  return [...out];
}

// ---------------- Redactar ----------------

export type Written = { newsletter: Newsletter; source: "ai" | "simulated"; error?: string };

export async function writeNewsletter(
  brief: string,
  w: WriterProfile,
  format: FormatId | undefined,
  opts: { polish?: boolean; quick?: boolean } = {},
): Promise<Written> {
  if (!aiEnabled()) return { newsletter: simulateNewsletter(brief, w), source: "simulated" };
  try {
    const fmt = format && format !== "auto" ? format : w.format;
    const system = [COPY_BIBLE, formatBlock(fmt), personaBlock(w)].join("\n\n");
    const notes = `NOTAS DEL AUTOR (única fuente de hechos):\n"""\n${brief.slice(0, 4000)}\n"""`;
    const user = `${notes}\n\nAntes de escribir, decide en "plan" el ángulo que hace especial esta pieza, el gancho de apertura y la estructura. Después escribe la pieza completa.`;

    const draft = await callModel(DraftSchema, system, user, { effort: opts.quick ? "low" : "medium", timeoutMs: 70_000 });
    let n = toNewsletter(draft);

    if ((opts.polish ?? true) && polishEnabled()) {
      try {
        const sus = suspiciousNumbers(brief, n);
        const polishUser = `${notes}\n\nBORRADOR A MEJORAR:\n${JSON.stringify(n)}${
          sus.length ? `\n\nATENCIÓN: estas cifras NO aparecen en las notas y hay que quitarlas o sustituirlas por algo cierto: ${sus.join(", ")}.` : ""
        }`;
        n = toNewsletter(await callModel(PieceSchema, `${system}\n\n${EDITOR}`, polishUser, { effort: "low", timeoutMs: 50_000 }));
      } catch (e) {
        console.error("[ai] el editor jefe falló; se usa el borrador", e);
      }
    }
    return { newsletter: n, source: "ai" };
  } catch (e) {
    console.error("[ai] fallo al redactar", e);
    return { newsletter: simulateNewsletter(brief, w), source: "simulated", error: describe(e) };
  }
}

export async function reviseNewsletter(current: Newsletter, instruction: string, w: WriterProfile, brief: string, format: FormatId): Promise<Written> {
  if (!aiEnabled()) return { newsletter: simulateRevision(current, instruction, w), source: "simulated" };
  try {
    const system = [COPY_BIBLE, formatBlock(format), personaBlock(w)].join("\n\n");
    const user = `${brief ? `NOTAS ORIGINALES DEL AUTOR (única fuente de hechos):\n"""\n${brief.slice(0, 4000)}\n"""\n\n` : ""}Esta es la newsletter actual:\n${JSON.stringify(current)}\n\nEl autor te pide este cambio: «${instruction.slice(0, 500)}»\n\nAplícalo con oficio y devuelve la newsletter COMPLETA modificada. Mantén lo que no te pida cambiar. No inventes datos nuevos.`;
    const n = toNewsletter(await callModel(PieceSchema, system, user, { effort: "low", timeoutMs: 70_000 }));
    if (current.ctaUrl) n.ctaUrl = current.ctaUrl;
    return { newsletter: n, source: "ai" };
  } catch (e) {
    console.error("[ai] fallo al revisar", e);
    return { newsletter: current, source: "simulated", error: describe(e) };
  }
}

function describe(e: unknown): string {
  if (e instanceof OpenAI.APIError) {
    if (e.code === "insufficient_quota") return "Tu cuenta de OpenAI se ha quedado sin saldo. Recárgala en platform.openai.com > Billing.";
    if (e instanceof OpenAI.AuthenticationError) return "La clave de OpenAI no es válida.";
    if (e instanceof OpenAI.PermissionDeniedError || e instanceof OpenAI.NotFoundError) return `Tu clave de OpenAI no puede usar el modelo ${OPENAI_MODEL()}. Prueba otro con OPENAI_MODEL.`;
    if (e instanceof OpenAI.RateLimitError) return "La IA está saturada ahora mismo. Prueba en un minuto.";
    if (e instanceof OpenAI.APIConnectionTimeoutError) return "La IA ha tardado demasiado.";
    return `La IA ha dado un error (${e.status ?? "?"}).`;
  }
  if (e instanceof Anthropic.AuthenticationError) return "La clave de Anthropic no es válida.";
  if (e instanceof Anthropic.PermissionDeniedError) return "La clave de Anthropic no tiene permiso para este modelo.";
  if (e instanceof Anthropic.RateLimitError) return "La IA está saturada ahora mismo. Prueba en un minuto.";
  if (e instanceof Anthropic.APIConnectionTimeoutError) return "La IA ha tardado demasiado.";
  if (e instanceof Anthropic.APIError) return `La IA ha dado un error (${e.status ?? "?"}).`;
  return e instanceof Error ? e.message : "Error inesperado de la IA.";
}
