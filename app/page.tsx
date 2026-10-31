import Demo from "@/components/Demo";

const STEPS = [
  {
    n: "01",
    title: "Habla",
    text: "Cuenta lo que ha pasado esta semana en tu negocio o tu proyecto. 30 segundos bastan.",
  },
  {
    n: "02",
    title: "AutoMailX escribe",
    text: "Convierte tu nota en una newsletter con tu tono, sin inventar nada que tú no hayas dicho.",
  },
  {
    n: "03",
    title: "Tú apruebas",
    text: "Lees, ajustas si quieres y la envías con un toque. Nada sale sin tu visto bueno.",
  },
];

export default function Home() {
  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <a href="#" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-sm">
            ✎
          </span>
          AutoMailX
        </a>
        <a
          href="#lista"
          className="glass rounded-full px-4 py-2 text-sm text-muted transition hover:text-text"
        >
          Acceso anticipado
        </a>
      </header>

      <main className="flex-1">
        {/* HERO */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-20 pt-8 lg:grid-cols-[1.1fr_0.9fr] lg:pt-16">
          <div className="anim-fade-up text-center lg:text-left">
            <p className="glass mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-muted lg:mx-0">
              <span className="h-1.5 w-1.5 rounded-full bg-ok" /> Prueba la demo ahora, sin registrarte
            </p>
            <h1 className="text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Cuenta tu semana.
              <br />
              <span className="text-gradient">Tu newsletter ya está escrita.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted lg:mx-0">
              Graba una nota de voz y AutoMailX la convierte en un correo listo para enviar, con tu tono y
              un diseño cuidado. Sin página en blanco. Sin excusas para no escribir.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <a
                href="#demo"
                className="rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:scale-[1.03]"
              >
                Probar la demo
              </a>
              <a href="#como" className="glass rounded-full px-6 py-3 font-medium transition hover:bg-white/10">
                Cómo funciona
              </a>
            </div>
          </div>

          <div id="demo" className="scroll-mt-8">
            <Demo />
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section id="como" className="mx-auto w-full max-w-6xl scroll-mt-8 px-5 py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            De tu voz a la bandeja de entrada en tres pasos
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="glass rounded-3xl p-7">
                <p className="text-gradient text-sm font-bold">{s.n}</p>
                <h3 className="mt-3 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* LISTA DE ESPERA */}
        <section id="lista" className="mx-auto w-full max-w-3xl scroll-mt-8 px-5 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Sé de los primeros en usarlo
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted">
            Estamos terminando la versión con cuentas y envío real. Déjanos tu correo y te avisamos.
          </p>
          <p className="glass mx-auto mt-8 inline-block rounded-2xl px-5 py-3 text-sm text-muted">
            Formulario de lista de espera: pendiente de conectar (siguiente fase).
          </p>
        </section>
      </main>

      <footer className="border-t border-line px-5 py-8 text-center text-sm text-muted">
        AutoMailX
      </footer>
    </>
  );
}
