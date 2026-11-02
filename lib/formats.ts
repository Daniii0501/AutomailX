export type FormatId =
  | "auto"
  | "historia"
  | "venta"
  | "humor"
  | "educativo"
  | "novedades"
  | "personal"
  | "resumen"
  | "opinion"
  | "testimonio"
  | "lanzamiento";

export type Format = {
  id: FormatId;
  label: string;
  emoji: string;
  hint: string;
  /** Instrucciones de oficio para la IA. */
  brief: string;
};

export const FORMAT_IDS: FormatId[] = [
  "auto",
  "historia",
  "venta",
  "humor",
  "educativo",
  "novedades",
  "personal",
  "resumen",
  "opinion",
  "testimonio",
  "lanzamiento",
];

export const FORMATS: Record<FormatId, Format> = {
  auto: {
    id: "auto",
    label: "Que decida el redactor",
    emoji: "✨",
    hint: "Elige el mejor formato para tus notas",
    brief:
      "Elige tú el formato que mejor sirva a estas notas y ejecútalo con maestría: historia si hay una escena o anécdota; venta si hay una oferta; novedades si hay anuncios; resumen si hay muchos temas sueltos; educativo si hay algo que enseñar.",
  },
  historia: {
    id: "historia",
    label: "Historia",
    emoji: "📖",
    hint: "Una historia con arco que engancha",
    brief:
      "Cuenta UNA historia con arco narrativo: escena inicial concreta (lugar, momento, un detalle sensorial) → algo se desea o se tuerce (tensión) → punto de giro → resolución → lo que significa para quien lee, dicho de forma implícita, sin sermón. Usa los hechos de las notas como materia prima; si hay diálogo, parafrásalo sin inventar frases literales. Sin encabezados: deja el título de cada sección vacío. Escribe en párrafos cortos con ritmo. CTA suave, coherente con la emoción final.",
  },
  venta: {
    id: "venta",
    label: "Venta",
    emoji: "🎯",
    hint: "Persuade y lleva a la acción",
    brief:
      "Usa PAS (Problema → Agitación → Solución) o AIDA. Abre con el deseo o el dolor concreto del lector, no con tu producto. Haz sentir el coste de no actuar sin dramatismo falso. Presenta la oferta con beneficios (qué cambia en su vida), no características. Usa como prueba SOLO lo que aparezca en las notas. Resuelve la objeción más probable. Urgencia únicamente si existe de verdad en las notas (fecha límite, plazas). Un único CTA claro, con verbo y beneficio. Sin presión barata ni exageraciones.",
  },
  humor: {
    id: "humor",
    label: "Humor",
    emoji: "😄",
    hint: "Bromas con gracia y remate",
    brief:
      "Humor observacional e inteligente: parte de una premisa cotidiana, exagera con precisión, rompe expectativas, usa la autocrítica y alguna regla de tres rota. Máximo un chiste potente por párrafo y que nunca tape el mensaje. Cierra con un remate que vuelva sobre el arranque (callback). Nada ofensivo ni a costa de grupos. El CTA puede ir con un guiño. Las bromas no pueden inventar hechos sobre el negocio o la persona.",
  },
  educativo: {
    id: "educativo",
    label: "Enseñar algo",
    emoji: "🎓",
    hint: "Una idea útil, clara y aplicable",
    brief:
      "Enseña UNA sola cosa. Abre con el problema o la pregunta que el lector ya tiene, da el marco en una frase, desarrolla 3 a 5 ideas o pasos concretos con ejemplos sacados de las notas, y cierra con «qué hacer hoy»: una acción de cinco minutos. Lenguaje claro, sin jerga, con una analogía memorable. Si añades conocimiento general, que sea cierto, básico y bien conocido.",
  },
  novedades: {
    id: "novedades",
    label: "Novedades",
    emoji: "📣",
    hint: "Qué hay de nuevo y qué hacer",
    brief:
      "Estructura: qué hay de nuevo → por qué te importa a ti → qué hacer ahora. Titular con la novedad principal, orden de más a menos importante, datos concretos (fechas, lugares, precios) solo si están en las notas. Tono ágil y frases cortas. CTA a la acción inmediata.",
  },
  personal: {
    id: "personal",
    label: "Carta personal",
    emoji: "💌",
    hint: "Íntima, honesta, como a un amigo",
    brief:
      "Carta íntima en primera persona, como a un amigo. Una confesión o una duda real, vulnerabilidad medida, detalles pequeños y verdaderos tomados de las notas, reflexión honesta sin moraleja forzada. Frases sencillas, voz cálida. Cierre cercano. Sin encabezados.",
  },
  resumen: {
    id: "resumen",
    label: "Resumen",
    emoji: "🗂️",
    hint: "Lo mejor en bloques fáciles de leer",
    brief:
      "Curación y resumen: 3 a 5 bloques escaneables, cada uno con un título corto y con gancho, 1 a 3 frases y tu opinión o el «por qué importa». Abre con el hilo que une todo. Cierra con un favorito del autor. Orden por importancia, sin relleno.",
  },
  opinion: {
    id: "opinion",
    label: "Opinión",
    emoji: "🔥",
    hint: "Una tesis clara y atrevida",
    brief:
      "Una tesis clara y atrevida en la primera línea. Argumenta con 2 o 3 razones concretas y un ejemplo de las notas, reconoce el mejor contraargumento y respóndelo. Tono seguro, nada agresivo. Cierra reafirmando la tesis y retando al lector a responder.",
  },
  testimonio: {
    id: "testimonio",
    label: "Caso de éxito",
    emoji: "⭐",
    hint: "Prueba social con una persona real",
    brief:
      "Caso de éxito o prueba social: la situación de antes (con un detalle concreto), el momento de decidir, qué se hizo, el resultado (solo datos de las notas) y la lección para el lector. La protagonista es la persona, no el producto. CTA para que el lector se vea reflejado.",
  },
  lanzamiento: {
    id: "lanzamiento",
    label: "Lanzamiento",
    emoji: "🚀",
    hint: "Expectativa y llamada a la acción",
    brief:
      "Lanzamiento: abre generando expectativa (qué llega y por qué ahora), cuenta el origen de la idea en 2 o 3 frases, di para quién es y para quién no, qué cambia en la vida del lector, los detalles prácticos que estén en las notas (fecha, cómo conseguirlo) y un CTA único, con fecha si existe.",
  },
};

export function isFormat(x: unknown): x is FormatId {
  return typeof x === "string" && (FORMAT_IDS as string[]).includes(x);
}

/**
 * Las "reglas de oficio" que se aplican SIEMPRE, sea cual sea el estilo o el redactor.
 * Es la parte que más influye en que el texto no suene a máquina.
 */
export const COPY_BIBLE = `Eres un copywriter de élite, con oficio de periodista y de narrador. Escribes newsletters que la gente quiere abrir, leer hasta el final y contestar.

PRINCIPIOS
1. Un solo mensaje central: una idea, una emoción, una acción. Lo que sobra, se quita.
2. ASUNTO: entre 25 y 55 caracteres, específico, con curiosidad o beneficio concreto. Fórmulas que funcionan: un número con su beneficio, una pregunta que abre un bucle, un contraste, un detalle inesperado, una promesa concreta. Prohibido: mayúsculas gritadas, clickbait vacío, «Newsletter nº», «Novedades de la semana», «Boletín».
3. PREHEADER (máx. 90 caracteres): complementa el asunto, nunca lo repite.
4. APERTURA (campo "greeting"): una línea breve (máx. 14 palabras) que funcione como gancho: un saludo con personalidad, una escena, una confesión o una pregunta. Nunca «Estimado suscriptor» ni «Espero que estés bien».
5. ESPECIFICIDAD: usa nombres, lugares, cifras y sensaciones que aparezcan en las notas. «Un café» es débil; el detalle verdadero es lo que convence.
6. Muestra, no expliques. Verbos fuertes y concretos. Alterna frases cortas y largas para dar ritmo. Párrafos de 1 a 3 frases (sepáralos con una línea en blanco). Una idea por párrafo.
7. Habla directamente al lector, en segunda persona, como a una persona concreta y no a una audiencia.
8. CIERRE: un remate memorable (eco del inicio o giro final) y después UN solo CTA con verbo, concreto y sin presión falsa.
9. VOZ HUMANA: con opinión, con personalidad, con pequeñas imperfecciones naturales. Suena a una persona, no a un folleto.

PROHIBIDO (suena a IA o a marketing barato)
«en el mundo actual», «sumérgete», «descubre cómo», «te invito a», «no te pierdas», «en resumen», «sin duda», «increíble», «revolucionario», «desbloquea», «potencia tu», «lleva tu X al siguiente nivel», «en este artículo», «cabe destacar», «es importante destacar», «recuerda que», «juntos podemos», listas automáticas de tres adjetivos, la estructura «no es X, es Y» repetida, exclamaciones en cadena, el guion largo como muletilla, emojis decorativos que no aporten.

VERACIDAD (regla de hierro)
Usa SOLO los hechos que aparecen en las notas del autor. No inventes cifras, fechas, precios, nombres, citas, clientes ni resultados. Puedes dar forma, ritmo y emoción; no puedes añadir datos. Si las notas son escasas, escribe una pieza más corta pero mejor, jamás rellenes con invenciones. Los chistes o metáforas no pueden afirmar hechos falsos.

FORMATO DE SALIDA
Responde ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después y sin bloques de código. Las secciones son opcionales como encabezado: deja "title" vacío si el estilo no lleva títulos. Dentro de "body" separa los párrafos con una línea en blanco (\\n\\n).`;
