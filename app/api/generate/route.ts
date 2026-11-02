import { writeNewsletter } from "@/lib/ai";
import { ANIMALS, isAnimal } from "@/lib/animals";
import { dbConfigured } from "@/lib/db";
import { fail, json, open, readBody, sameOrigin } from "@/lib/http";
import { simulateNewsletter, type WriterProfile, EMPTY_CUSTOM } from "@/lib/newsletter";
import { clientIp, hit } from "@/lib/rate";
import { showcaseFor } from "@/lib/showcase";
import { clean } from "@/lib/util";

export const maxDuration = 90;

/** Demo de la portada (sin registro). Con la nota de ejemplo devuelve el texto escrito a mano. */
export const POST = open(async (req) => {
  if (!sameOrigin(req)) return fail("Petición no permitida.", 403);
  const b = await readBody(req);
  const animal = isAnimal(b.animal) ? b.animal : "zorro";
  const note = clean(b.note, 1500);
  if (note.length < 20) return fail("Cuéntale algo más (una o dos frases).");

  const showcase = showcaseFor(note, animal);
  if (showcase) return json({ newsletter: showcase, source: "showcase" });

  const writer: WriterProfile = {
    kind: "animal",
    animal,
    name: ANIMALS[animal].defaultName,
    avatar: "",
    color: "",
    about: "",
    formality: 30,
    length: "corto",
    emojis: 1,
    sample: "",
    format: "auto",
    custom: { ...EMPTY_CUSTOM },
  };
  // Límite por IP para que nadie gaste la IA desde la portada.
  const allowed = dbConfigured() ? await hit(`demo-ip:${clientIp(req)}`, 6).catch(() => false) : false;
  if (!allowed) return json({ newsletter: simulateNewsletter(note, writer), source: "simulated", limited: dbConfigured() });
  const w = await writeNewsletter(note, writer, "auto", { polish: false, quick: true });
  return json({ newsletter: w.newsletter, source: w.source });
});
