export type AnimalId = "zorro" | "buho" | "gato" | "oso" | "conejo" | "pulpo";

export type AnimalInfo = {
  id: AnimalId;
  species: string;
  defaultName: string;
  emoji: string;
  color: string;
  soft: string;
  tagline: string;
  bestFor: string;
  /** Instrucción de voz para la IA. */
  voice: string;
  headings: string[];
  /** [informal, formal] */
  greet: [string, string];
  sign: [string, string];
  cta: [string, string];
};

export const ANIMAL_IDS: AnimalId[] = ["zorro", "buho", "gato", "oso", "conejo", "pulpo"];

export const ANIMALS: Record<AnimalId, AnimalInfo> = {
  zorro: {
    id: "zorro",
    species: "Zorro",
    defaultName: "Rufo",
    emoji: "🦊",
    color: "#F08A3C",
    soft: "#FFE9D6",
    tagline: "Astuto y persuasivo",
    bestFor: "Vender y captar la atención",
    voice:
      "astuto y persuasivo: frases cortas que enganchan, ganchos que despiertan curiosidad y una llamada a la acción clara; sin relleno",
    headings: ["Lo que te interesa", "Ojo a esto", "Y esto también"],
    greet: ["Psst, tengo algo para ti", "Estimado lector:"],
    sign: ["Hasta pronto,", "Un cordial saludo,"],
    cta: ["Aprovecha antes de que se acabe", "Más información, aquí"],
  },
  buho: {
    id: "buho",
    species: "Búho",
    defaultName: "Atlas",
    emoji: "🦉",
    color: "#8A5A3C",
    soft: "#F1E4D6",
    tagline: "Sabio y riguroso",
    bestFor: "Explicar con claridad y generar confianza",
    voice:
      "sabio, claro y riguroso: explica con calma, ordena las ideas y transmite confianza; tono profesional y sereno",
    headings: ["Lo esencial", "Para tener en cuenta", "Un detalle más"],
    greet: ["Hola, te cuento con calma lo importante.", "Estimado lector:"],
    sign: ["Con calma,", "Atentamente,"],
    cta: ["Si quieres profundizar, escríbeme", "Para ampliar información, responda a este correo"],
  },
  gato: {
    id: "gato",
    species: "Gato",
    defaultName: "Mishi",
    emoji: "🐱",
    color: "#7C8AA5",
    soft: "#E4E9F2",
    tagline: "Irónico y elegante",
    bestFor: "Marcar estilo y diferenciarte",
    voice:
      "irónico, elegante y con humor seco: observador, con frases ingeniosas y sin exclamaciones exageradas",
    headings: ["Lo que importa", "Para los curiosos", "Ah, y una cosa más"],
    greet: ["Hola. Sí, otra newsletter. Esta merece la pena.", "Estimado lector:"],
    sign: ["Sin prisa,", "Atentamente,"],
    cta: ["Respóndeme si te animas", "Quedo a su disposición respondiendo a este correo"],
  },
  oso: {
    id: "oso",
    species: "Oso",
    defaultName: "Teddy",
    emoji: "🐻",
    color: "#A9744F",
    soft: "#F4E3D3",
    tagline: "Cálido y cercano",
    bestFor: "Cuidar a tu comunidad",
    voice:
      "cálido y cercano, como un amigo que te da un abrazo: frases sencillas, mucha empatía y agradecimiento",
    headings: ["Lo más bonito de la semana", "Para que lo sepas", "Y para terminar"],
    greet: ["¡Hola! Qué ganas de contarte cómo va todo.", "Estimado lector:"],
    sign: ["Un abrazo grande,", "Un cordial saludo,"],
    cta: ["Cuéntame qué te ha parecido", "Quedo atento a sus comentarios"],
  },
  conejo: {
    id: "conejo",
    species: "Conejo",
    defaultName: "Flash",
    emoji: "🐰",
    color: "#EC7FA0",
    soft: "#FFE3EB",
    tagline: "Rápido y enérgico",
    bestFor: "Novedades y noticias al momento",
    voice:
      "enérgico y veloz: titulares con fuerza, frases muy cortas y ritmo ágil, ideal para novedades",
    headings: ["Lo último", "Apunta esto", "Y de regalo"],
    greet: ["¡Rápido, que hay novedades!", "Estimado lector, novedades breves:"],
    sign: ["¡Nos vemos enseguida!", "Hasta la próxima,"],
    cta: ["Corre y échale un vistazo", "Consulte los detalles"],
  },
  pulpo: {
    id: "pulpo",
    species: "Pulpo",
    defaultName: "Inky",
    emoji: "🐙",
    color: "#8B6CF0",
    soft: "#E9E2FF",
    tagline: "Organizado y curioso",
    bestFor: "Resumir y reunir muchas cosas",
    voice:
      "organizado y curioso: resume muchas cosas en bloques claros y fáciles de escanear, con orden y precisión",
    headings: ["Resumen", "Por si te lo perdiste", "Una cosa más"],
    greet: ["Hola, ocho brazos y cero desorden: aquí tienes el resumen.", "Estimado lector, resumen de la semana:"],
    sign: ["Hasta la próxima,", "Un saludo,"],
    cta: ["Dime qué te gustaría ver más", "Indique qué temas le interesan"],
  },
};

export function isAnimal(x: unknown): x is AnimalId {
  return typeof x === "string" && (ANIMAL_IDS as string[]).includes(x);
}
