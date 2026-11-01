"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Brand from "@/components/Brand";
import { api } from "@/lib/client";

const NAV = [
  { href: "/panel", label: "Inicio", icon: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { href: "/panel/audiencia", label: "Audiencia", icon: "M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0" },
  { href: "/panel/historial", label: "Historial", icon: "M12 7v5l3 2M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" },
  { href: "/panel/ajustes", label: "Ajustes", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z" },
];

function active(path: string, href: string) {
  return href === "/panel" ? path === "/panel" || path.startsWith("/panel/n/") || path.startsWith("/panel/redactores") : path.startsWith(href);
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export default function AppShell({
  email,
  banner,
  children,
}: {
  email: string;
  banner: string | null;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();

  async function logout() {
    await api("/api/auth/logout", "POST");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col">
      {banner && (
        <div className="bg-amber-100 px-4 py-2 text-center text-xs text-amber-900" role="status">
          {banner}
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Brand href="/panel" size="sm" />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${active(path, n.href) ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden max-w-[180px] truncate text-muted lg:block">{email}</span>
            <button onClick={logout} className="text-muted hover:text-ink">Salir</button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-28 pt-8 md:pb-14">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/90 backdrop-blur-xl md:hidden" aria-label="Principal móvil">
        <div className="mx-auto grid max-w-md grid-cols-4 px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-2">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium ${active(path, n.href) ? "text-brand" : "text-muted"}`}
            >
              <Icon d={n.icon} />
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
