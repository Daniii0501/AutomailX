import { body } from "@/lib/api";
import { ANIMALS, isAnimal } from "@/lib/animals";
import { writeNewsletter } from "@/lib/ai";
import { hit } from "@/lib/rate";
import { clean, ipHash, json, sameOrigin } from "@/lib/util";

export const maxDuration = 60;

/** Demo pública de la landing: sin cuenta, con límites para proteger la clave de IA. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Petición no permitida." }, 403);

  const b = await body<{ note?: string; animal?: string }>(req);
  const note = clean(b.note, 1500);
  if (note.length < 15) return json({ error: "Cuéntame un poco más (mínimo una frase)." }, 400);
  const animal = isAnimal(b.animal) ? b.animal : "zorro";

  if (!(await hit(`demo:${ipHash(req)}`, 8)) || !(await hit("demo:global", 400))) {
    return json({ error: "Has probado mucho hoy. Crea tu cuenta gratis para seguir." }, 429);
  }

  const { newsletter, source } = await writeNewsletter(note, {
    animal,
    name: ANIMALS[animal].defaultName,
    about: "",
    formality: 35,
    length: "medio",
    emojis: 1,
    sample: "",
  });
  return json({ newsletter, source });
}
