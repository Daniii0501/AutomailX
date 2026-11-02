import Link from "next/link";
import Brand from "./Brand";

export default function Legal({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Brand />
      <article className="card mt-8 space-y-4 p-6 leading-relaxed sm:p-8 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-bold">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="banner banner-warn">Borrador. Revísalo con un profesional antes de abrir la web al público.</p>
        {children}
      </article>
      <p className="mt-6 text-center text-sm"><Link href="/" className="underline">Volver a la portada</Link></p>
    </main>
  );
}
