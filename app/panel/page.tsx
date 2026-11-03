import Link from "next/link";
import Animal from "@/components/Animal";
import Composer, { type WriterLite } from "@/components/Composer";
import WriterAvatar from "@/components/WriterAvatar";
import { aiEnabled } from "@/lib/ai";
import { ANIMALS, ANIMAL_IDS } from "@/lib/animals";
import { demoLogin, requireUser } from "@/lib/auth";
import { listWriters } from "@/lib/data";
import { count, eq } from "@/lib/db";
import { mailEnabled } from "@/lib/email";
import { lookOf } from "@/lib/newsletter";
import { FREE } from "@/lib/plans";

export default async function PanelHome() {
  const user = await requireUser();
  const [writers, confirmed, drafts] = await Promise.all([
    listWriters(user.id),
    count("subscribers", { user_id: eq(user.id), status: eq("confirmed") }),
    count("newsletters", { user_id: eq(user.id), status: eq("draft") }),
  ]);

  if (writers.length === 0) {
    return (
      <div className="anim-fade-up">
        <h1 className="text-3xl font-bold">Bienvenido a AutoMailX 👋</h1>
        <p className="mt-2 text-lg text-muted">Primero, contrata a tu redactor. Elige uno: luego podrás ajustarlo a tu gusto.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ANIMAL_IDS.map((id) => {
            const a = ANIMALS[id];
            return (
              <Link key={id} href={`/panel/redactores/nuevo?animal=${id}`} className="card flex flex-col items-center p-4 text-center transition hover:-translate-y-0.5">
                <Animal id={id} size={72} />
                <span className="mt-2 font-semibold">{a.defaultName}</span>
                <span className="text-xs text-muted">{a.tagline}</span>
              </Link>
            );
          })}
        </div>
        <Link href="/panel/redactores/nuevo?kind=custom" className="card mt-3 flex items-center gap-3 p-4 transition hover:-translate-y-0.5">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1edff] text-2xl" aria-hidden>✍️</span>
          <span>
            <span className="block font-semibold">Prefiero uno a medida</span>
            <span className="text-sm text-muted">Con tu propia voz, tus palabras y tus reglas.</span>
          </span>
        </Link>
      </div>
    );
  }

  const lite: WriterLite[] = writers.map((w) => ({ id: w.id!, name: w.name, look: lookOf(w), format: w.format, tagline: w.kind === "custom" ? "A medida" : ANIMALS[w.animal].tagline }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">¿Qué ha pasado esta semana?</h1>
        <p className="mt-1 text-muted">Cuéntalo, revisa y envía. Tres gestos.</p>
      </div>

      {!aiEnabled() && (
        <p className="banner banner-warn">
          <strong>Modo simulado.</strong> Falta conectar la IA (variable <code>OPENAI_API_KEY</code> o <code>ANTHROPIC_API_KEY</code> en Vercel). Mientras tanto, los borradores solo reordenan tus notas.
        </p>
      )}
      {!mailEnabled() && (
        <p className="banner banner-info">
          Los envíos están en <strong>modo prueba</strong>: no sale ningún correo real hasta conectar Resend (<code>RESEND_API_KEY</code>).
        </p>
      )}
      {demoLogin() && (
        <p className="banner banner-warn">
          La <strong>entrada directa de pruebas</strong> está activada (<code>ALLOW_DEMO_LOGIN</code>). Quítala en Vercel antes de enseñar la web a nadie.
        </p>
      )}

      <Composer writers={lite} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/panel/audiencia" className="card p-4 transition hover:-translate-y-0.5">
          <p className="text-sm text-muted">Suscriptores confirmados</p>
          <p className="text-2xl font-bold">{confirmed}</p>
          {confirmed === 0 && <p className="hint">Añade tu primer lector en Audiencia →</p>}
        </Link>
        <Link href="/panel/historial" className="card p-4 transition hover:-translate-y-0.5">
          <p className="text-sm text-muted">Borradores por enviar</p>
          <p className="text-2xl font-bold">{drafts}</p>
          {drafts > 0 && <p className="hint">Revísalos en Historial →</p>}
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-bold">Tu equipo</h2>
        <div className="mt-3 space-y-2">
          {lite.map((w) => (
            <Link key={w.id} href={`/panel/redactores/${w.id}`} className="card flex items-center gap-3 p-3 transition hover:-translate-y-0.5">
              <WriterAvatar look={w.look} size={44} />
              <span className="flex-1">
                <span className="block font-semibold">{w.name}</span>
                <span className="text-sm text-muted">{w.tagline}</span>
              </span>
              <span className="text-sm font-semibold text-muted">Editar</span>
            </Link>
          ))}
          {writers.length < FREE.writers && (
            <Link href="/panel/redactores/nuevo" className="flex items-center justify-center rounded-3xl border border-dashed border-line p-4 text-sm font-semibold text-muted hover:bg-white">
              + Contratar otro redactor
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
