import type { AnimalId } from "./animals";
import { SAMPLE_NOTE, type Newsletter } from "./newsletter";

/**
 * Ejemplos escritos a mano para la demo de la portada.
 * Todos parten de la misma nota de ejemplo (SAMPLE_NOTE) y usan solo sus hechos,
 * cada uno con la voz de su animal y un estilo de copy distinto.
 */
export const SHOWCASE: Record<AnimalId, Newsletter> = {
  // VENTA
  zorro: {
    subject: "Viernes a las 18:00: catas gratis",
    preheader: "Y la carta de otoño ya está en la mesa.",
    greeting: "Psst. Esto te va a interesar.",
    sections: [
      {
        title: "Lo nuevo",
        body: "Hay semanas en las que pides lo de siempre y te vas con la sensación de que te falta algo. Esta no tiene por qué ser una de ellas.\n\nHemos estrenado la carta de otoño y un café de especialidad de Etiopía se ha llevado todos los aplausos. La gente lo prueba y no habla de otra cosa.",
      },
      {
        title: "Tu plan",
        body: "No hace falta que nos creas. El viernes a las seis hacemos catas gratis: lo pruebas, decides tú.\n\nUn detalle que conviene apuntar: el sábado cerramos por una boda. El viernes es tu momento.",
      },
      {
        title: "Y además",
        body: "Abrimos una segunda terraza. Más sitio para ti y para quien quieras traer.",
      },
    ],
    cta: "Apúntate a la cata del viernes",
    signoff: "Hasta el viernes,",
  },

  // EDUCATIVO
  buho: {
    subject: "Cómo catar un café en 3 gestos",
    preheader: "El viernes a las seis lo practicamos, gratis.",
    greeting: "Hola. Hoy toca aprender algo útil.",
    sections: [
      {
        title: "La idea",
        body: "Un buen café de especialidad no se bebe: se explora. El café de Etiopía que hemos incorporado a la carta de otoño es un buen ejemplo, porque invita a ir despacio.",
      },
      {
        title: "Tres gestos",
        body: "1. Huélelo antes de probarlo. El aroma ya te cuenta la mitad de la historia.\n\n2. Da un primer sorbo corto y deja que recorra la boca.\n\n3. Espera unos segundos. Lo que queda después es lo que más se recuerda.",
      },
      {
        title: "Para practicar",
        body: "El viernes a las seis hacemos catas gratis: el mejor momento para ensayar estos tres gestos con el café delante. Recuerda que el sábado cerramos por una boda, y que ya tenemos una segunda terraza. Gracias a los clientes de siempre por hacer posible todo esto.",
      },
    ],
    cta: "Ven el viernes a las seis",
    signoff: "Con calma,",
  },

  // HUMOR
  gato: {
    subject: "Tu café de siempre tiene un rival etíope",
    preheader: "Catas gratis el viernes. Cero compromiso, mucha cafeína.",
    greeting: "Hola. Sí, otra newsletter. Esta lleva café.",
    sections: [
      {
        title: "",
        body: "Hemos estrenado la carta de otoño y ha pasado algo que no habíamos previsto: la gente se ha vuelto loca con un café de especialidad de Etiopía. Gente seria, de pedir siempre lo mismo. Traidores. Los entendemos.",
      },
      {
        title: "",
        body: "Para que te sumes a la deslealtad con garantías, el viernes a las seis hacemos catas gratis. Gratis, como la mirada de desaprobación de tu cafetera de casa.",
      },
      {
        title: "",
        body: "Apunta también que el sábado cerramos por una boda. No, no es la nuestra. Y que abrimos una segunda terraza, para que tu pereza tenga más superficie.\n\nGracias, de corazón, a los clientes de siempre. Os queremos incluso cuando pedís lo mismo de siempre.",
      },
    ],
    cta: "Ven el viernes y traiciona a tu cafetera",
    signoff: "Sin prisa,",
  },

  // HISTORIA / CARTA PERSONAL
  oso: {
    subject: "Lo que no sale en la carta de otoño",
    preheader: "Una pequeña historia y un gracias grande.",
    greeting: "Hola, qué ganas tenía de contarte esto.",
    sections: [
      {
        title: "",
        body: "Esta semana colgamos la carta de otoño. Lo que más me ha emocionado no ha sido ningún plato, sino ver cómo la gente se ha vuelto loca con el café de especialidad de Etiopía. Así, sin más. Un café.",
      },
      {
        title: "",
        body: "Y entonces me acordé de vosotros, los de siempre. Los que estabais aquí antes de que existiera esta carta o este café. Porque sí: abrimos una segunda terraza, y ese espacio es, en el fondo, vuestro.",
      },
      {
        title: "",
        body: "El viernes a las seis haremos catas gratis. Ven, siéntate y cuéntame qué tal el café. Y recuerda que el sábado cerramos por una boda. Por una vez, nos toca celebrar con otros.",
      },
    ],
    cta: "Cuéntame qué tal el café",
    signoff: "Un abrazo grande,",
  },

  // NOVEDADES
  conejo: {
    subject: "Nueva carta, nueva terraza, catas gratis",
    preheader: "Cuatro novedades, lectura rápida.",
    greeting: "¡Rápido, que hay novedades!",
    sections: [
      {
        title: "Carta de otoño",
        body: "Ya está en marcha. Y el café de especialidad de Etiopía la ha liado: la gente no habla de otra cosa.",
      },
      {
        title: "Catas gratis",
        body: "Viernes a las 18:00. Sin coste y sin compromiso.",
      },
      {
        title: "Segunda terraza",
        body: "Abrimos otra. Más sitio para todos.",
      },
      {
        title: "Ojo con el sábado",
        body: "Cerramos por una boda. Planifica tu café con tiempo.\n\nY gracias a los clientes de siempre: sin vosotros, nada de esto.",
      },
    ],
    cta: "Corre el viernes a las 18:00",
    signoff: "¡Nos vemos enseguida!",
  },

  // RESUMEN
  pulpo: {
    subject: "Carta nueva, café etíope y terraza extra",
    preheader: "Todo lo que ha pasado, ordenado en cuatro bloques.",
    greeting: "Hola, ocho brazos y cero desorden: aquí va el resumen.",
    sections: [
      {
        title: "1 · Carta de otoño",
        body: "Estrenada esta semana. Lo más comentado: el café de especialidad de Etiopía, que ha conquistado a los clientes.",
      },
      {
        title: "2 · Catas gratis",
        body: "El viernes, a las seis. La ocasión ideal para descubrir ese café.",
      },
      {
        title: "3 · Terraza nueva",
        body: "Abrimos una segunda terraza.",
      },
      {
        title: "4 · Aviso",
        body: "El sábado cerramos por una boda.",
      },
      {
        title: "Y un gracias",
        body: "A los clientes de siempre: gracias por seguir ahí.",
      },
    ],
    cta: "Dime qué te gustaría ver más",
    signoff: "Hasta la próxima,",
  },
};

/** Estilo de copy con el que está escrito cada ejemplo. */
export const SHOWCASE_STYLE: Record<AnimalId, string> = {
  zorro: "Venta",
  buho: "Enseñar algo",
  gato: "Humor",
  oso: "Historia",
  conejo: "Novedades",
  pulpo: "Resumen",
};

const norm = (s: string) => s.replace(/\s+/g, " ").trim();

/** Si la nota es la de ejemplo de la portada, devolvemos el texto escrito a mano. */
export function showcaseFor(note: string, animal: AnimalId): Newsletter | null {
  return norm(note) === norm(SAMPLE_NOTE) ? SHOWCASE[animal] : null;
}
