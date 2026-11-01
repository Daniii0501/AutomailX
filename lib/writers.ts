import { isAnimal } from "./animals";
import { clean } from "./util";

export type WriterInput = {
  animal: string;
  name: string;
  about: string;
  formality: number;
  length: "corto" | "medio" | "largo";
  emojis: number;
  sample: string;
};

export function parseWriter(b: Record<string, unknown>): WriterInput | string {
  if (!isAnimal(b.animal)) return "Elige un animal.";
  const name = clean(b.name, 30);
  if (name.length < 2) return "Ponle un nombre a tu redactor.";
  const f = Math.round(Number(b.formality ?? 40));
  const e = Math.round(Number(b.emojis ?? 1));
  const length = b.length === "corto" || b.length === "largo" ? b.length : "medio";
  return {
    animal: b.animal,
    name,
    about: clean(b.about, 1200),
    formality: Number.isFinite(f) ? Math.max(0, Math.min(100, f)) : 40,
    length,
    emojis: Number.isFinite(e) ? Math.max(0, Math.min(2, e)) : 1,
    sample: clean(b.sample, 3000),
  };
}
