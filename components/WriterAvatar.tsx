import Animal from "@/components/Animal";
import type { AnimalId } from "@/lib/animals";
import { lookOf } from "@/lib/look";

export type AvatarWriter = { kind: "animal" | "custom"; animal: AnimalId; avatar: string; color: string };

/** Cara de un redactor: el animal, o el emoji y color elegidos si es a medida. */
export default function WriterAvatar({ w, size = 48, className = "" }: { w: AvatarWriter; size?: number; className?: string }) {
  if (w.kind === "animal") return <Animal id={w.animal} size={size} className={className} />;
  const look = lookOf(w);
  return (
    <span
      role="img"
      aria-label="Redactor a medida"
      className={`inline-grid shrink-0 place-items-center rounded-full ${className}`}
      style={{ width: size, height: size, background: look.soft, boxShadow: `inset 0 0 0 2px ${look.color}55`, fontSize: size * 0.48, lineHeight: 1 }}
    >
      {look.emoji}
    </span>
  );
}
