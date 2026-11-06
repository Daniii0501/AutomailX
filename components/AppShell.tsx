"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Brand from "./Brand";

const NAV = [
  { href: "/panel", label: "Escribir", icon: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" },
  { href: "/panel/temas", label: "Temas", icon: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" },
  { href: "/panel/audiencia", label: "Audiencia", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" },
  { href: "/panel/estadisticas", label: "Métricas", icon: "M3 3v18h18M8 17v-5M13 17V8M18 17v-8" },
  { href: "/panel/historial", label: "Historial", icon: "M3 3v5h5M3.05 13A9 9 0 1 0 6 5.3L3 8M12 7v5l4 2" },
  { href: "/panel/ajustes", label: "Ajustes", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export default function AppShell({ email, children }: { email: string; children: React.ReactNode }) {
  const path = usePathname();
  const active = (href: string) => (href === "/panel" ? path === "/panel" || path.startsWith("/panel/n/") || path.startsWith("/panel/redactores") : path.startsWith(href));

  return (
    <div className="min-h-dvh md:flex">
      {/* Barra lateral (escritorio) */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-white/60 px-4 py-6 backdrop-blur md:flex">
        <div className="px-2">
          <Brand href="/panel" />
        </div>
        <nav className="mt-8 flex flex-col gap-1" aria-label="Panel">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active(n.href) ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] font-medium transition ${active(n.href) ? "bg-ink text-white" : "text-ink hover:bg-[#f4f2ef]"}`}
            >
              <Icon d={n.icon} />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto px-2">
          <p className="truncate text-xs text-muted" title={email}>{email}</p>
          <form method="post" action="/api/auth/logout">
            <button className="mt-1 text-xs font-semibold text-muted underline underline-offset-2 hover:text-ink">Cerrar sesión</button>
          </form>
        </div>
      </aside>

      {/* Cabecera (móvil) */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-[#fbfaf8]/85 px-4 py-3 backdrop-blur md:hidden">
        <Brand href="/panel" size={26} />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-28 md:px-8 md:pt-10 md:pb-16">{children}</main>

      {/* Barra inferior (móvil) */}
      <nav aria-label="Panel" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active(n.href) ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[0.64rem] font-medium ${active(n.href) ? "text-brand" : "text-muted"}`}
          >
            <Icon d={n.icon} />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
