import { ANIMALS, type AnimalId } from "./animals";

export const CUSTOM_AVATARS = ["✍️", "🧠", "🔥", "🌿", "🎤", "☕", "🎨", "🚀", "🦄", "📚", "💡", "🌙", "🎯", "🧸", "🪄", "🐝"];
export const CUSTOM_COLORS = ["#6D4AFF", "#F08A3C", "#1F9D6B", "#D6405A", "#2F80ED", "#C050D8", "#E6A700", "#0F766E"];

export type LookInput = { kind: "animal" | "custom"; animal: AnimalId; avatar: string; color: string };

export type Look = { color: string; soft: string; emoji: string };

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Color, fondo suave y emoji de un redactor, sea animal o a medida. */
export function lookOf(w: LookInput): Look {
  if (w.kind === "custom") {
    const color = HEX.test(w.color) ? w.color : CUSTOM_COLORS[0];
    return { color, soft: `${color}26`, emoji: w.avatar || "✍️" };
  }
  const a = ANIMALS[w.animal];
  return { color: a.color, soft: a.soft, emoji: a.emoji };
}
