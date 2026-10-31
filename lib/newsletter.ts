export type Tone = "cercano" | "profesional" | "divertido";

export type Newsletter = {
  subject: string;
  preheader: string;
  greeting: string;
  sections: { title: string; body: string }[];
  cta: string;
  signoff: string;
};

export const TONES: { id: Tone; label: string }[] = [
  { id: "cercano", label: "Cercano" },
  { id: "profesional", label: "Profesional" },
  { id: "divertido", label: "Divertido" },
];

export const SAMPLE_NOTE =
  "Esta semana lancé la nueva carta de otoño en la cafetería, la gente se ha vuelto loca con el café de especialidad de Etiopía. Además cerramos el sábado por una boda y el viernes hacemos catas gratis a las seis. Quiero agradecer a los clientes de siempre y contar que abrimos una segunda terraza.";

const STRIP = /[\s,;:.!?¡¿]+$/g;

function sentences(note: string): string[] {
  return note
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim().replace(STRIP, ""))
    .filter((s) => s.length > 8);
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Recorta por palabra completa (y por coma si la frase es larga) para no partir palabras. */
function shorten(s: string, max: number): string {
  if (s.length <= max) return s;
  const comma = s.indexOf(",");
  if (comma > 15 && comma <= max) return s.slice(0, comma);
  const cut = s.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return (space > 15 ? cut.slice(0, space) : cut).replace(STRIP, "") + "…";
}

/**
 * Simulated generator used when no ANTHROPIC_API_KEY is configured.
 * It is deterministic and only reshuffles what the user said, so the demo
 * never invents facts that were not in the note.
 */
export function simulateNewsletter(note: string, tone: Tone): Newsletter {
  const ss = sentences(note);
  const first = ss[0] ?? "Lo que pasó esta semana";
  const rest = ss.slice(1);

  const greeting = {
    cercano: "Hola, ¿qué tal la semana?",
    profesional: "Estimados suscriptores:",
    divertido: "¡Ey! Siéntate, que hay novedades 👀",
  }[tone];

  const signoff = {
    cercano: "Un abrazo,",
    profesional: "Atentamente,",
    divertido: "Hasta la próxima (no te me pierdas),",
  }[tone];

  const cta = {
    cercano: "Cuéntame qué te ha parecido",
    profesional: "Responde a este correo para más información",
    divertido: "Respóndeme y dime tu favorito",
  }[tone];

  const sections = [
    { title: "Lo más importante", body: `${cap(first)}.` },
    ...rest.slice(0, 3).map((s, i) => ({
      title: ["También esta semana", "Apunta esto", "Y una cosa más"][i],
      body: `${cap(s)}.`,
    })),
  ];

  return {
    subject: shorten(cap(first), 60),
    preheader: shorten(rest[0] ? cap(rest[0]) : "Lo que tienes que saber esta semana", 90),
    greeting,
    sections,
    cta,
    signoff,
  };
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
