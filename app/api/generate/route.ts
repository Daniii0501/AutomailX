import { simulateNewsletter, type Newsletter, type Tone } from "@/lib/newsletter";

const TONES: Tone[] = ["cercano", "profesional", "divertido"];
const MAX_NOTE = 4000;

const SYSTEM = `Eres el editor de una newsletter. Conviertes la nota hablada de una persona en una newsletter breve en español.
Reglas estrictas:
- Usa SOLO hechos que aparezcan en la nota. No inventes datos, cifras, fechas ni nombres.
- Respeta el tono pedido.
- Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional ni bloques de código, con esta forma:
{"subject": string (máx 60 caracteres), "preheader": string (máx 90), "greeting": string, "sections": [{"title": string, "body": string}] (2 a 4 secciones, cada body de 1 a 3 frases), "cta": string, "signoff": string}`;

function isNewsletter(x: unknown): x is Newsletter {
  if (!x || typeof x !== "object") return false;
  const n = x as Record<string, unknown>;
  return (
    typeof n.subject === "string" &&
    typeof n.preheader === "string" &&
    typeof n.greeting === "string" &&
    typeof n.cta === "string" &&
    typeof n.signoff === "string" &&
    Array.isArray(n.sections) &&
    n.sections.length > 0 &&
    n.sections.every(
      (s) =>
        s &&
        typeof (s as Record<string, unknown>).title === "string" &&
        typeof (s as Record<string, unknown>).body === "string",
    )
  );
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

export async function POST(request: Request) {
  let body: { note?: unknown; tone?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const note = typeof body.note === "string" ? body.note.trim().slice(0, MAX_NOTE) : "";
  const tone = TONES.includes(body.tone as Tone) ? (body.tone as Tone) : "cercano";

  if (note.length < 15) {
    return Response.json({ error: "Cuéntame un poco más (mínimo una frase)." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ newsletter: simulateNewsletter(note, tone), source: "simulated" });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
        max_tokens: 1200,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: `Tono: ${tone}\n\nNota hablada:\n"""\n${note}\n"""`,
          },
        ],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic ${res.status}`);
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    const parsed = extractJson(text);
    if (!isNewsletter(parsed)) throw new Error("Respuesta no válida");

    return Response.json({ newsletter: parsed, source: "claude" });
  } catch {
    // Nunca dejamos al usuario sin resultado en la demo.
    return Response.json({ newsletter: simulateNewsletter(note, tone), source: "simulated" });
  }
}
