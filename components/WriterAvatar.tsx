import Animal from "./Animal";
import { isAnimal } from "@/lib/animals";
import type { Look } from "@/lib/newsletter";

/** Cara del redactor: el dibujo del animal o, si es a medida, su emoji sobre su color. */
export default function WriterAvatar({ look, size = 48, className = "" }: { look: Look; size?: number; className?: string }) {
  if (look.animal && isAnimal(look.animal)) return <Animal id={look.animal} size={size} className={className} title={look.name} />;
  return (
    <span
      role="img"
      aria-label={look.name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{ width: size, height: size, background: `${look.color}26`, fontSize: size * 0.5 }}
    >
      {look.emoji}
    </span>
  );
}
