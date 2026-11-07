import Link from "next/link";
import Animal from "@/components/Animal";
import Brand from "@/components/Brand";
import Demo from "@/components/Demo";
import PricingCards from "@/components/PricingCards";
import { ANIMALS, ANIMAL_IDS } from "@/lib/animals";
import { FORMATS, FORMAT_IDS } from "@/lib/formats";

const STEPS = [
  { n: "1", t: "Cuéntalo", d: "Dicta o escribe lo que ha pasado, tal cual te salga. Dos frases bastan." },
  { n: "2", t: "Revisa", d: "Tu redactor lo convierte en una newsletter con gancho. Cambia lo que quieras o pídele retoques." },
  { n: "3", t: "Envía", d: "Un botón. Te dice a cuántas personas va antes de mandarla." },
];

const PERKS = [
  { e: "🎙️", t: "Habla, no escribas", d: "Díctale tu semana con la voz, desde el móvil." },
  { e: "🗓️", t: "Temas programados", d: "Apunta ideas, elige día y hora, y tu redactor las escribe solo." },
  { e: "🔍", t: "No se inventa nada", d: "Solo usa los datos que le das. Si aparece una cifra rara, te avisa." },
  { e: "🔑", t: "Sin contraseñas", d: "Entras con un enlace a tu correo. Nada que recordar." },
  { e: "💌", t: "Tu propia página", d: "Un enlace para que la gente se apunte, con doble confirmación." },
  { e: "👋", t: "Baja en un clic", d: "Tus lectores se van cuando quieren. Cumple la ley sin pensar en ella." },
];

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Brand />
        <nav className="flex items-center gap-2">
          <Link href="/premium" className="hidden px-3 text-sm font-semibold text-muted hover:text-ink sm:inline">Premium</Link>
          <Link href="/login" className="btn btn-soft !px-4 !py-2 text-sm">Entrar</Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pt-10 pb-14 text-center sm:px-6 sm:pt-16">
          <div className="anim-fade-up mx-auto mb-6 flex justify-center -space-x-3">
            {ANIMAL_IDS.map((id, i) => (
              <span key={id} className="anim-pop rounded-full ring-4 ring-[#fbfaf8]" style={{ animationDelay: `${i * 70}ms` }}>
                <Animal id={id} size={52} />
              </span>
            ))}
          </div>
          <h1 className="anim-fade-up mx-auto max-w-3xl text-[2.6rem] leading-[1.05] font-bold sm:text-6xl">
            Cuéntaselo a un zorro.
            <br />
            <span className="text-gradient">Él te escribe la newsletter.</span>
          </h1>
          <p className="anim-fade-up mx-auto mt-5 max-w-xl text-lg text-muted" style={{ animationDelay: "120ms" }}>
            Contrata a un redactor con personalidad, cuéntale tu semana en dos frases y envía a tu lista una newsletter que la gente sí abre.
          </p>
          <div className="anim-fade-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "200ms" }}>
            <Link href="/login" className="btn btn-primary w-full sm:w-auto">Empieza gratis</Link>
            <a href="#demo" className="btn btn-soft w-full sm:w-auto">Pruébalo sin registrarte</a>
          </div>
          <p className="mt-4 text-sm text-muted">Sin tarjeta. Sin contraseñas. En español.</p>
        </section>

        {/* Demo */}
        <section id="demo" className="mx-auto max-w-6xl scroll-mt-6 px-4 pb-20 sm:px-6">
          <h2 className="mb-2 text-center text-3xl font-bold sm:text-4xl">Pruébalo ahora</h2>
          <p className="mb-8 text-center text-muted">Elige un redactor y mira lo que hace con la misma semana.</p>
          <Demo />
        </section>

        {/* Plantilla */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Conoce a la plantilla</h2>
          <p className="mt-2 mb-8 text-center text-muted">Seis personalidades. O créate uno a medida, con tu voz.</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {ANIMAL_IDS.map((id) => {
              const a = ANIMALS[id];
              return (
                <div key={id} className="card p-4 sm:p-5">
                  <Animal id={id} size={64} />
                  <p className="mt-3 text-lg font-bold">{a.defaultName} <span className="text-sm font-normal text-muted">· {a.species}</span></p>
                  <p className="text-sm font-semibold" style={{ color: a.color }}>{a.tagline}</p>
                  <p className="mt-1 text-sm text-muted">Ideal para {a.bestFor.toLowerCase()}.</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Estilos */}
        <section className="mx-auto max-w-4xl px-4 pb-20 text-center sm:px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">Cada newsletter, con su estilo</h2>
          <p className="mt-2 mb-8 text-muted">Diez formas de contarlo, escritas con oficio de verdad.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {FORMAT_IDS.filter((id) => id !== "auto").map((id) => (
              <span key={id} className="chip cursor-default" title={FORMATS[id].hint}>
                {FORMATS[id].emoji} {FORMATS[id].label}
              </span>
            ))}
          </div>
        </section>

        {/* Pasos */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <h2 className="mb-8 text-center text-3xl font-bold sm:text-4xl">Tres gestos y está enviada</h2>
          <ol className="grid gap-3 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="card p-6">
                <span className="text-gradient text-4xl font-bold">{s.n}</span>
                <p className="mt-2 text-xl font-bold">{s.t}</p>
                <p className="mt-1 text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Ventajas */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <h2 className="mb-8 text-center text-3xl font-bold sm:text-4xl">Hecho para que no te dé pereza</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PERKS.map((p) => (
              <div key={p.t} className="card p-5">
                <span className="text-2xl" aria-hidden>{p.e}</span>
                <p className="mt-2 font-bold">{p.t}</p>
                <p className="text-sm text-muted">{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Planes */}
        <section id="precios" className="mx-auto max-w-4xl scroll-mt-6 px-4 pb-20 sm:px-6">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Empieza gratis. Crece con Premium.</h2>
          <p className="mt-2 mb-8 text-center text-muted">Sin tarjeta para empezar. <Link href="/premium" className="font-semibold text-brand underline-offset-2 hover:underline">Todo sobre Premium →</Link></p>
          <PricingCards context="public" />
        </section>

        {/* CTA final */}
        <section className="mx-auto max-w-3xl px-4 pb-24 text-center sm:px-6">
          <div className="card px-6 py-12">
            <div className="flex justify-center"><Animal id="zorro" size={80} /></div>
            <h2 className="mt-4 text-3xl font-bold">Rufo está listo para empezar</h2>
            <p className="mx-auto mt-2 max-w-md text-muted">Tu próxima newsletter está a dos frases de distancia.</p>
            <Link href="/login" className="btn btn-primary mt-6">Contratar a mi redactor</Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:px-6">
          <Brand size={24} />
          <nav className="flex gap-4">
            <Link href="/privacidad" className="hover:text-ink">Privacidad</Link>
            <Link href="/terminos" className="hover:text-ink">Términos</Link>
            <Link href="/premium" className="hover:text-ink">Premium</Link>
            <Link href="/login" className="hover:text-ink">Entrar</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
