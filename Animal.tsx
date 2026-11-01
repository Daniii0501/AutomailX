import { ANIMALS, type AnimalId } from "@/lib/animals";

type Props = {
  id: AnimalId;
  size?: number;
  /** Fondo circular pastel. */
  bg?: boolean;
  className?: string;
  title?: string;
};

const INK = "#2A1D1A";

function Eyes({ y = 62, gap = 18, r = 5.5, color = INK }: { y?: number; gap?: number; r?: number; color?: string }) {
  const xs = [60 - gap, 60 + gap];
  return (
    <g>
      {xs.map((x) => (
        <g key={x}>
          <circle cx={x} cy={y} r={r} fill={color} />
          <circle cx={x + 1.8} cy={y - 2} r={r * 0.32} fill="#fff" />
        </g>
      ))}
    </g>
  );
}

function Blush({ y = 76, gap = 30, color = "#FF8FA3" }: { y?: number; gap?: number; color?: string }) {
  return (
    <g opacity="0.45">
      <ellipse cx={60 - gap} cy={y} rx="6.5" ry="4" fill={color} />
      <ellipse cx={60 + gap} cy={y} rx="6.5" ry="4" fill={color} />
    </g>
  );
}

function Art({ id }: { id: AnimalId }) {
  switch (id) {
    case "zorro":
      return (
        <g>
          <path d="M20 52 L15 12 L52 34 Z" fill="#F08A3C" />
          <path d="M100 52 L105 12 L68 34 Z" fill="#F08A3C" />
          <path d="M25 40 L22 23 L41 34 Z" fill="#3A2622" />
          <path d="M95 40 L98 23 L79 34 Z" fill="#3A2622" />
          <path d="M12 58 C12 34 34 28 60 28 C86 28 108 34 108 58 C108 84 88 106 60 110 C32 106 12 84 12 58 Z" fill="#F08A3C" />
          <path d="M12 60 C17 84 38 98 60 102 C50 84 32 70 12 60 Z" fill="#FFF7EE" />
          <path d="M108 60 C103 84 82 98 60 102 C70 84 88 70 108 60 Z" fill="#FFF7EE" />
          <path d="M44 38 L60 30 L76 38 L60 56 Z" fill="#FFB877" opacity="0.5" />
          <Eyes y={62} gap={19} />
          <ellipse cx="60" cy="92" rx="6.5" ry="5" fill={INK} />
          <path d="M60 97 Q60 103 54 104 M60 97 Q60 103 66 104" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      );
    case "buho":
      return (
        <g>
          <path d="M22 44 L20 14 L48 30 Z" fill="#6E4630" />
          <path d="M98 44 L100 14 L72 30 Z" fill="#6E4630" />
          <ellipse cx="60" cy="64" rx="46" ry="46" fill="#8A5A3C" />
          <ellipse cx="60" cy="98" rx="26" ry="12" fill="#D9B48F" />
          <circle cx="40" cy="58" r="20" fill="#F6E7D0" />
          <circle cx="80" cy="58" r="20" fill="#F6E7D0" />
          <circle cx="40" cy="58" r="12" fill="#FFC53D" />
          <circle cx="80" cy="58" r="12" fill="#FFC53D" />
          <circle cx="40" cy="58" r="6" fill="#1D1410" />
          <circle cx="80" cy="58" r="6" fill="#1D1410" />
          <circle cx="42.5" cy="55.5" r="2" fill="#fff" />
          <circle cx="82.5" cy="55.5" r="2" fill="#fff" />
          <path d="M53 70 L67 70 L60 85 Z" fill="#F28C28" />
          <path d="M36 24 Q46 30 52 40 M84 24 Q74 30 68 40" stroke="#6E4630" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
    case "gato":
      return (
        <g>
          <path d="M18 56 L16 14 L52 34 Z" fill="#7C8AA5" />
          <path d="M102 56 L104 14 L68 34 Z" fill="#7C8AA5" />
          <path d="M24 44 L23 26 L40 35 Z" fill="#F6B2C4" />
          <path d="M96 44 L97 26 L80 35 Z" fill="#F6B2C4" />
          <ellipse cx="60" cy="68" rx="46" ry="40" fill="#7C8AA5" />
          <path d="M52 34 L52 44 M60 32 L60 44 M68 34 L68 44" stroke="#5E6B87" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="60" cy="84" rx="18" ry="12" fill="#E4E9F2" />
          <ellipse cx="41" cy="64" rx="7" ry="8" fill="#F4D35E" />
          <ellipse cx="79" cy="64" rx="7" ry="8" fill="#F4D35E" />
          <ellipse cx="41" cy="64" rx="2.6" ry="6.5" fill="#1C2230" />
          <ellipse cx="79" cy="64" rx="2.6" ry="6.5" fill="#1C2230" />
          <path d="M56 78 L64 78 L60 83 Z" fill="#F28BA8" />
          <path d="M60 83 L60 86 M60 86 Q54 92 49 88 M60 86 Q66 92 71 88" stroke="#3A3350" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M30 80 L10 76 M30 86 L10 90 M90 80 L110 76 M90 86 L110 90" stroke="#E4E9F2" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case "oso":
      return (
        <g>
          <circle cx="26" cy="32" r="15" fill="#A9744F" />
          <circle cx="94" cy="32" r="15" fill="#A9744F" />
          <circle cx="26" cy="32" r="8" fill="#E8C9A5" />
          <circle cx="94" cy="32" r="8" fill="#E8C9A5" />
          <circle cx="60" cy="66" r="47" fill="#A9744F" />
          <ellipse cx="60" cy="82" rx="21" ry="16" fill="#E8C9A5" />
          <Eyes y={60} gap={22} r={5.5} color="#2A1A12" />
          <ellipse cx="60" cy="75" rx="8" ry="5.5" fill="#2A1A12" />
          <path d="M60 80 L60 85 M60 85 Q54 91 49 87 M60 85 Q66 91 71 87" stroke="#2A1A12" strokeWidth="2" fill="none" strokeLinecap="round" />
          <Blush y={74} gap={34} />
        </g>
      );
    case "conejo":
      return (
        <g>
          <ellipse cx="42" cy="26" rx="11" ry="27" fill="#F6F1EA" stroke="#E3D8CB" strokeWidth="1.5" transform="rotate(-8 42 26)" />
          <ellipse cx="78" cy="26" rx="11" ry="27" fill="#F6F1EA" stroke="#E3D8CB" strokeWidth="1.5" transform="rotate(8 78 26)" />
          <ellipse cx="42" cy="28" rx="5.5" ry="19" fill="#F6B8C8" transform="rotate(-8 42 28)" />
          <ellipse cx="78" cy="28" rx="5.5" ry="19" fill="#F6B8C8" transform="rotate(8 78 28)" />
          <ellipse cx="60" cy="74" rx="42" ry="37" fill="#F6F1EA" stroke="#E3D8CB" strokeWidth="1.5" />
          <Eyes y={68} gap={20} color="#2B2230" />
          <Blush y={82} gap={31} />
          <path d="M55 78 L65 78 L60 84 Z" fill="#F28BA8" />
          <path d="M60 84 Q56 90 51 87 M60 84 Q64 90 69 87" stroke="#6B4A52" strokeWidth="2" fill="none" strokeLinecap="round" />
          <rect x="56" y="89" width="8" height="8" rx="2" fill="#fff" stroke="#E3D8CB" strokeWidth="1.5" />
        </g>
      );
    case "pulpo":
      return (
        <g>
          {[24, 42, 60, 78, 96].map((x, i) => (
            <path key={x} d={`M${x - 9} 78 Q${x - 9} ${100 + (i % 2) * 6} ${x} ${100 + (i % 2) * 6} Q${x + 9} ${100 + (i % 2) * 6} ${x + 9} 78 Z`} fill="#8B6CF0" />
          ))}
          <path d="M14 70 C14 32 34 12 60 12 C86 12 106 32 106 70 L106 84 L14 84 Z" fill="#9B80FA" />
          <circle cx="36" cy="30" r="3" fill="#B8A4FF" />
          <circle cx="86" cy="26" r="4" fill="#B8A4FF" />
          <circle cx="94" cy="44" r="2.4" fill="#B8A4FF" />
          <circle cx="44" cy="60" r="11" fill="#fff" />
          <circle cx="76" cy="60" r="11" fill="#fff" />
          <circle cx="45" cy="61" r="5.5" fill="#2B1B4A" />
          <circle cx="77" cy="61" r="5.5" fill="#2B1B4A" />
          <circle cx="47" cy="58.5" r="1.9" fill="#fff" />
          <circle cx="79" cy="58.5" r="1.9" fill="#fff" />
          <Blush y={80} gap={34} />
          <path d="M52 80 Q60 88 68 80" stroke="#2B1B4A" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </g>
      );
  }
}

export default function Animal({ id, size = 64, bg = true, className = "", title }: Props) {
  const a = ANIMALS[id];
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title ?? a.species}
    >
      {bg && <circle cx="60" cy="60" r="58" fill={a.soft} />}
      <Art id={id} />
    </svg>
  );
}
