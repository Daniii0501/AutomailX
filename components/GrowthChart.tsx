"use client";

import { useEffect, useRef, useState } from "react";

type Week = { week: string; joined: number; left: number };

const H = 200;
const PAD = { top: 22, right: 8, bottom: 26, left: 28 };
const BRAND = "#6d4aff";

const short = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "short" });

/** Barra con el extremo de datos redondeado (4px) y la base recta. */
function barPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

/** Altas confirmadas por semana. Una sola serie: sin leyenda, el título la nombra. */
export default function GrowthChart({ weeks }: { weeks: Week[] }) {
  const [hover, setHover] = useState<number | null>(null);
  // Se dibuja al ancho real del contenedor para que los textos tengan siempre su tamaño (11px).
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const max = Math.max(1, ...weeks.map((w) => w.joined));
  const niceMax = max <= 4 ? 4 : Math.ceil(max / 4) * 4;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const band = plotW / Math.max(1, weeks.length);
  const barW = Math.min(24, band * 0.6);
  const y = (v: number) => PAD.top + plotH - (v / niceMax) * plotH;
  const ticks = [0, niceMax / 2, niceMax];
  const last = weeks.length - 1;
  const peak = weeks.reduce((best, w, i) => (w.joined > weeks[best].joined ? i : best), 0);
  const h = hover !== null ? weeks[hover] : null;

  return (
    <div className="relative" ref={box}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Altas de suscriptores por semana">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="rgba(23,23,26,.08)" strokeDasharray={t === 0 ? undefined : "2 4"} />
            <text x={PAD.left - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#8a8a93">{t}</text>
          </g>
        ))}
        {weeks.map((w, i) => {
          const cx = PAD.left + band * i + band / 2;
          const top = y(w.joined);
          const hgt = PAD.top + plotH - top;
          const dim = hover !== null && hover !== i;
          const label = w.joined > 0 && (i === last || i === peak);
          return (
            <g
              key={w.week}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onClick={() => setHover(i)}
              tabIndex={0}
              role="img"
              aria-label={`Semana del ${short(w.week)}: ${w.joined} altas, ${w.left} bajas`}
              className="cursor-default outline-none"
            >
              <rect x={cx - band / 2} y={PAD.top} width={band} height={plotH} fill="transparent" />
              {w.joined > 0 && <path d={barPath(cx - barW / 2, top, barW, hgt)} fill={BRAND} opacity={dim ? 0.35 : 1} />}
              {label && (
                <text x={cx} y={top - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill="#17171a">{w.joined}</text>
              )}
              {(i % (W < 420 ? 4 : 3) === last % (W < 420 ? 4 : 3)) && (
                <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill="#8a8a93">{short(w.week)}</text>
              )}
            </g>
          );
        })}
      </svg>
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 whitespace-nowrap rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-lg"
          style={(() => {
            const x = PAD.left + band * hover + band / 2;
            // cerca de los bordes, el tooltip se apoya hacia dentro en vez de salirse
            if (x > W - 90) return { right: Math.max(0, W - x - 12) };
            if (x < 90) return { left: Math.max(0, x - 12) };
            return { left: x, transform: "translateX(-50%)" };
          })()}
        >
          <p className="font-semibold">Semana del {short(h.week)}</p>
          <p className="mt-0.5 flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: BRAND }} /> {h.joined} {h.joined === 1 ? "alta" : "altas"}</p>
          <p className="text-muted">{h.left} {h.left === 1 ? "baja" : "bajas"}</p>
        </div>
      )}
    </div>
  );
}
