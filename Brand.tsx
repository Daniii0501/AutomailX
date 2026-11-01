import Link from "next/link";

export default function Brand({ href = "/", size = "md" }: { href?: string; size?: "sm" | "md" }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-semibold tracking-tight">
      <span
        className={`grid place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-2 text-white ${
          size === "sm" ? "h-7 w-7 text-sm" : "h-8 w-8 text-base"
        }`}
        aria-hidden
      >
        ✉
      </span>
      <span className={size === "sm" ? "text-base" : "text-lg"}>AutoMailX</span>
    </Link>
  );
}
