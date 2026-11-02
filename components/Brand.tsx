import Link from "next/link";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center rounded-[30%] text-white shadow-sm"
      style={{ width: size, height: size, fontSize: size * 0.5, background: "linear-gradient(135deg,#6d4aff 0%,#c050d8 55%,#ff8a3d 100%)" }}
    >
      ✉
    </span>
  );
}

export default function Brand({ href = "/", size = 30 }: { href?: string; size?: number }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-bold tracking-tight text-ink" aria-label="AutoMailX, inicio">
      <Logo size={size} />
      <span className="text-[1.05rem]">AutoMailX</span>
    </Link>
  );
}
