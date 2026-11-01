import Link from "next/link";
import Animal from "@/components/Animal";
import Brand from "@/components/Brand";
import Demo from "@/components/Demo";
import { ANIMAL_IDS, ANIMALS } from "@/lib/animals";
import { FREE } from "@/lib/plans";

const STEPS = [
  { n: "1", title: "Elige a tu redactor", text: "Un animal con personalidad propia. Ponle nombre y enséñale cómo escribes." },
  { n: "2", title: "Cuéntale tu semana", text: "Con la voz o con texto. Sin plantillas ni páginas en blanco." },
  { n: "3", title: "Aprueba y envía", text: "Léelo, pídele cambios hablando y envíalo a tu lista con un toque." },
];

const FEATURES = [
  { t: "Nunca inventa", d: "Solo usa lo que tú le cuentas. Nada de datos o cifras que no hayas dicho." },
  { t: "Tú mandas siempre", d: "Nada se envía sin tu visto bueno. Primero te mandas una prueba a ti." },
  { t: "Suscriptores en regla", d: "Formulario público con confirmación por correo y baja con un clic en cada envío." },
  { t: "Tu estilo, no el de un robot", d: "Pégale un texto tuyo y aprende cómo escribes. Ajusta tono, longitud y emojis." },
  { t: "Un equipo de redactores", d: "Uno para vender, otro para contar novedades. Cada uno con su voz." },
  { t: "Recordatorio semanal", d: "El día que elijas, tu redactor te avisa y te espera para que le cuentes la semana." },
];

export default function Home() {
  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Brand />
        <nav className="flex items-center gap-1 text-sm">
          <a href="#equipo" className="hidden rounded-full px-3 py-2 text-muted hover:text-ink sm:block">Redactores</a>
          <a href="#como" className="hidden rounded-full px-3 py-2 text-muted hover:text-ink sm:block">Cómo funciona</a>
          <a href="#precio" className="hidden rounded-full px-3 py-2 text-muted hover:text-ink sm:block">Precio</a>
          <Link href="/login" className="btn btn-primary ml-2 !px-5 !py-2.5">Entrar</Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* HERO */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-20 pt-8 lg:grid-cols-[1.1fr_0.9fr] lg:pt-14">
          <div className="anim-fade-up text-center lg:text-left">
            <div className="mb-6 flex justify-center gap-1 lg:justify-start" aria-hidden>
              {ANIMAL_IDS.map((id) => (
                <Animal key={id} id={id} size={42} className="-ml-2 first:ml-0 rounded-full ring-2 ring-white" />
              ))}
            </div>
            <h1 className="text-5xl font-bold leading-[1.02] sm:text-6xl lg:text-7xl">
              Contrata a tu
              <br />
              <span className="text-gradient">redactor de newsletters.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted lg:mx-0">
              Elige un animal, ponle nombre y cuéntale tu semana. Él escribe la newsletter con tu estilo; tú solo la
              apruebas y la envías.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link href="/login" className="btn btn-primary !px-7 !py-3.5">Crear mi redactor gratis</Link>
              <a href="#demo" className="btn btn-soft !px-7 !py-3.5">Probar la demo</a>
            </div>
            <p className="mt-4 text-sm text-muted">Sin tarjeta. Sin contraseñas: entras con un enlace a tu correo.</p>
          </div>
          <div id="demo" className="scroll-mt-8">
            <Demo />
          </div>
        </section>

        {/* EQUIPO */}
        <section id="equipo" className="mx-auto w-full max-w-6xl scroll-mt-8 px-5 py-20">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Conoce a la plantilla</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted">
            Seis personalidades para seis formas de contar las cosas. Puedes tener más de uno.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ANIMAL_IDS.map((id) => {
              const a = ANIMALS[id];
              return (
                <div key={id} className="card flex gap-4 p-5" style={{ background: `linear-gradient(160deg, ${a.soft}, #fff 70%)` }}>
                  <Animal id={id} size={76} className="shrink-0" />
                  <div>
                    <p className="font-semibold">
                      {a.defaultName} <span className="font-normal text-muted">· {a.species}</span>
                    </p>
                    <p className="text-sm font-medium" style={{ color: a.color }}>{a.tagline}</p>
                    <p className="mt-1 text-sm text-muted">Ideal para: {a.bestFor.toLowerCase()}.</p>
                    <p className="mt-2 text-sm italic text-ink/80">«{a.greet[0]}»</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section id="como" className="mx-auto w-full max-w-6xl scroll-mt-8 px-5 py-20">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Tres gestos y está enviada</h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="card p-7">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-sm font-semibold text-white">{s.n}</span>
                <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="mx-auto w-full max-w-6xl px-5 py-20">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Hecho para que no te dé pereza</h2>
          <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.t}>
                <h3 className="font-semibold">{f.t}</h3>
                <p className="mt-1.5 leading-relaxed text-muted">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PRECIO */}
        <section id="precio" className="mx-auto w-full max-w-3xl scroll-mt-8 px-5 py-20">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Empieza gratis</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="card p-7">
              <p className="font-semibold">Gratis</p>
              <p className="mt-1 text-4xl font-bold">0 €</p>
              <ul className="mt-5 space-y-2 text-sm text-muted">
                <li>✓ Hasta {FREE.writers} redactores</li>
                <li>✓ Hasta {FREE.subscribers} suscriptores</li>
                <li>✓ {FREE.aiPerDay} borradores o cambios al día</li>
                <li>✓ Página pública de suscripción</li>
              </ul>
              <Link href="/login" className="btn btn-primary mt-6 w-full">Empezar</Link>
            </div>
            <div className="card p-7 opacity-80">
              <p className="font-semibold">Pro</p>
              <p className="mt-1 text-4xl font-bold text-muted">Pronto</p>
              <ul className="mt-5 space-y-2 text-sm text-muted">
                <li>✓ Más redactores y más suscriptores</li>
                <li>✓ Envíos programados</li>
                <li>✓ Imágenes y estadísticas</li>
                <li>✓ Sin “Escrito con AutoMailX”</li>
              </ul>
              <button disabled className="btn btn-soft mt-6 w-full">Próximamente</button>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="mx-auto w-full max-w-3xl px-5 pb-24 pt-8 text-center">
          <h2 className="text-4xl font-bold sm:text-5xl">¿Quién va a escribir <span className="text-gradient">la tuya</span>?</h2>
          <Link href="/login" className="btn btn-primary mt-8 !px-8 !py-4 !text-base">Elegir a mi redactor</Link>
        </section>
      </main>

      <footer className="border-t border-line px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm text-muted">
          <Brand size="sm" />
          <div className="flex gap-5">
            <Link href="/privacidad" className="hover:text-ink">Privacidad</Link>
            <Link href="/terminos" className="hover:text-ink">Términos</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
