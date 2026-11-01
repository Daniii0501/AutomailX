import { ANIMALS } from "./animals";
import {
  sanitizeNewsletter,
  simulateNewsletter,
  simulateRevision,
  type Newsletter,
  type WriterProfile,
} from "./newsletter";

export const aiEnabled = () => !!process.env.ANTHROPIC_API_KEY;

const SHAPE = `{"subject": string (máx 60 caracteres, que invite a abrir), "preheader": string (máx 90), "greeting": string, "sections": [{"title": string, "body": string}], "cta": string (máx 60), "signoff": string}`;

function persona(w: WriterProfile): string {
  const a = ANIMALS[w.animal];
  const formality =
    w.formality >= 65 ? "formal y respetuoso (trato de usted o neutro)" : w.formality <= 30 ? "muy cercano e informal (tuteo)" : "cercano pero cuidado (tuteo)";
  const length =
    w.length === "corto"
      ? "corta: 1 o 2 secciones de 1 o 2 frases"
      : w.length === "largo"
        ? "larga: 3 a 5 secciones de 2 a 4 frases"
        : "media: 2 o 3 secciones de 1 a 3 frases";
  const emojis = w.emojis === 0 ? "no uses emojis" : w.emojis >= 2 ? "usa emojis con alegría" : "usa algún emoji suelto";

  return [
    `Eres "${w.name}", un redactor de newsletters con alma de ${a.species.toLowerCase()}. Tu personalidad: ${a.voice}.`,
    "Escribes en español de España, en nombre de la persona que te contrata, en primera persona (ella o él firma la newsletter).",
    "Reglas estrictas:",
    "- Usa SOLO hechos que aparezcan en las notas del autor. No inventes datos, cifras, fechas, precios, nombres ni citas.",
    "- Si falta información, escribe de forma general sin inventar.",
    `- Registro: ${formality}. Longitud: ${length}. Emojis: ${emojis}.`,
    w.about ? `- Sobre el autor o su negocio: ${w.about.slice(0, 1200)}` : "",
    w.sample
      ? `- Imita el estilo de este texto del autor (no copies su contenido):\n"""\n${w.sample.slice(0, 1500)}\n"""`
      : "",
    `- Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional ni bloques de código, con esta forma: ${SHAPE}`,
  ]
    .filter(Boolean)
    .join("\n");
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

async function callClaude(system: string, user: string): Promise<Newsletter> {
  const res = await fetch(process.env.ANTHROPIC_API_URL ?? "https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
      max_tokens: 1500,
      system,
      messages: [{ role: "user", content: user }],
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = data.content?.find((c) => c.type === "text")?.text ?? "";
  const n = sanitizeNewsletter(extractJson(text));
  if (!n) throw new Error("Respuesta no válida");
  return n;
}

export type Written = { newsletter: Newsletter; source: "claude" | "simulated" };

export async function writeNewsletter(brief: string, w: WriterProfile): Promise<Written> {
  if (aiEnabled()) {
    try {
      const n = await callClaude(persona(w), `Notas del autor:\n"""\n${brief.slice(0, 4000)}\n"""`);
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
): Promise<Written> {
  if (aiEnabled()) {
    try {
      const n = await callClaude(
        persona(w),
        `Esta es la newsletter actual (JSON):\n${JSON.stringify(current)}\n\nEl autor te pide este cambio: "${instruction.slice(0, 500)}"\n\nDevuelve la newsletter completa modificada, con la misma forma JSON. Mantén lo que no te pida cambiar y no inventes datos nuevos.`,
      );
      // conservamos el enlace del botón si el autor ya lo había puesto
      if (current.ctaUrl && !n.ctaUrl) n.ctaUrl = current.ctaUrl;
      return { newsletter: n, source: "claude" };
    } catch {
      // modo simulado
    }
  }
  return { newsletter: simulateRevision(current, instruction, w), source: "simulated" };
}
