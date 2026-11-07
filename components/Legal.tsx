import Link from "next/link";
import { BRAND, LEGAL_LINKS, LEGAL_UPDATED, OWNER, ownerComplete } from "@/lib/legal";
import Brand from "./Brand";

/** Un dato del titular; si falta, se marca bien visible para completarlo. */
export function Owner({ field }: { field: keyof typeof OWNER }) {
  const v = OWNER[field];
  return v ? <strong>{v}</strong> : <mark className="rounded bg-[#fff6e8] px-1 text-[#6b4a12]">[pendiente]</mark>;
}

export function ContactEmail() {
  return OWNER.email ? <a href={`mailto:${OWNER.email}`} className="font-semibold underline">{OWNER.email}</a> : <Owner field="email" />;
}

/** Pie con los enlaces legales (para todas las páginas públicas). */
export function LegalFooter({ className = "" }: { className?: string }) {
  return (
    <nav aria-label="Información legal" className={`flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted ${className}`}>
      {LEGAL_LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="hover:text-ink hover:underline">{l.label}</Link>
      ))}
    </nav>
  );
}

export default function Legal({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Brand />
      <article className="card mt-8 space-y-4 p-6 leading-relaxed sm:p-8 [&_a]:break-words [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ul]:list-disc [&_ul]:space-y-1">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-sm text-muted">Última actualización: {LEGAL_UPDATED}</p>
        {!ownerComplete() && (
          <p className="banner banner-warn text-sm">Faltan los datos del titular de {BRAND} (marcados como «pendiente»). Se completarán en breve.</p>
        )}
        {intro && <p>{intro}</p>}
        {children}
      </article>
      <LegalFooter className="mt-6" />
      <p className="mt-3 text-center text-sm"><Link href="/" className="underline">Volver a la portada</Link></p>
    </main>
  );
}
