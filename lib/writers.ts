import { isAnimal } from "./animals";
import { isFormat, type FormatId } from "./formats";
import { CUSTOM_AVATARS, CUSTOM_COLORS } from "./look";
import { EMPTY_CUSTOM, type CustomProfile } from "./newsletter";
import { clean } from "./util";

export type WriterInput = {
  kind: "animal" | "custom";
  animal: string;
  name: string;
  about: string;
  formality: number;
  length: "corto" | "medio" | "largo";
  emojis: number;
  sample: string;
  format: FormatId;
  avatar: string;
  color: string;
  profile: CustomProfile;
};

const num = (x: unknown, d: number, min = 0, max = 100) => {
  const n = Math.round(Number(x ?? d));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : d;
};

export function parseWriter(b: Record<string, unknown>): WriterInput | string {
  const kind = b.kind === "custom" ? "custom" : "animal";
  if (kind === "animal" && !isAnimal(b.animal)) return "Elige un animal.";

  const name = clean(b.name, 30);
  if (name.length < 2) return "Ponle un nombre a tu redactor.";

  const p = (b.profile && typeof b.profile === "object" ? b.profile : {}) as Record<string, unknown>;
  const profile: CustomProfile =
    kind === "custom"
      ? {
          voice: clean(p.voice, 1500),
          audience: clean(p.audience, 400),
          dos: clean(p.dos, 800),
          donts: clean(p.donts, 800),
          phrases: clean(p.phrases, 500),
          greeting: clean(p.greeting, 120),
          signoff: clean(p.signoff, 120),
          humor: num(p.humor, EMPTY_CUSTOM.humor),
          emotion: num(p.emotion, EMPTY_CUSTOM.emotion),
          language: p.language === "es-419" || p.language === "en" ? p.language : "es-ES",
        }
      : { ...EMPTY_CUSTOM };

  if (kind === "custom" && profile.voice.length < 10) {
    return "Cuéntale a tu redactor cómo escribe (aunque sean un par de frases).";
  }

  const avatar = typeof b.avatar === "string" && CUSTOM_AVATARS.includes(b.avatar) ? b.avatar : CUSTOM_AVATARS[0];
  const color = typeof b.color === "string" && CUSTOM_COLORS.includes(b.color) ? b.color : CUSTOM_COLORS[0];

  return {
    kind,
    animal: kind === "animal" ? String(b.animal) : "custom",
    name,
    about: clean(b.about, 1200),
    formality: num(b.formality, 40),
    length: b.length === "corto" || b.length === "largo" ? b.length : "medio",
    emojis: num(b.emojis, 1, 0, 2),
    sample: clean(b.sample, kind === "custom" ? 6000 : 3000),
    format: isFormat(b.format) ? b.format : "auto",
    avatar: kind === "custom" ? avatar : "",
    color: kind === "custom" ? color : "",
    profile,
  };
}
