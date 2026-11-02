"use client";

import { useState } from "react";
import { ANIMALS, ANIMAL_IDS, type AnimalId } from "@/lib/animals";
import { SAMPLE_NOTE, type Newsletter } from "@/lib/newsletter";
import Animal from "./Animal";

const STYLE: Record<AnimalId, string> = { zorro: "Venta", buho: "Enseñar algo", gato: "Humor", oso: "Historia", conejo: "Novedades", pulpo: "Resumen" };

export default function Demo() {
  const [animal, setAnimal] = useState<AnimalId>("zorro");
  const [note, setNote] = useState(SAMPLE_NOTE);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ n: Newsletter; animal: AnimalId; source: string } | null>(null);
  const [error, setError] = useState("");
  const a = ANIMALS[animal];

  async function go(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    const started = Date.now();
    try {
      const res = await fetch("/api/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ animal, note }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Algo ha fallado.");
      // Un pequeño suspense para que se vea al redactor "pensando".
      const wait = Math.max(0, 1400 - (Date.now() - started));
      await new Promise((r) => setTimeout(r, wait));
      setResult({ n: data.newsletter, animal, source: data.source });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo ha fallado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <form onSubmit={go} className="card p-5 sm:p-6">
        <p className="label">1 · Elige a tu redactor</p>
        <div className="grid grid-cols-6 gap-1.5">
          {ANIMAL_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setAnimal(id)}
              aria-pressed={animal === id}
              aria-label={`${ANIMALS[id].defaultName}, ${ANIMALS[id].species}`}
              className={`flex justify-center rounded-2xl p-1 transition ${animal === id ? "bg-[#f4f2ef] ring-2 ring-ink" : "hover:bg-[#faf9f7]"}`}
            >
              <Animal id={id} size={48} />
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm">
          <strong>{a.defaultName}</strong> <span className="text-muted">· {a.tagline}</span>
        </p>

        <label htmlFor="demo-note" className="label mt-5">2 · Cuéntale tu semana</label>
        <textarea id="demo-note" className="input" rows={5} maxLength={1500} value={note} onChange={(e) => setNote(e.target.value)} />
        <p className="hint">Es un ejemplo: cámbialo por lo tuyo si quieres.</p>
        {error && <p role="alert" className="banner banner-err mt-3">{error}</p>}
        <button className="btn btn-primary mt-4 w-full" disabled={busy || note.trim().length < 20}>
          {busy ? `${a.defaultName} está escribiendo…` : `Que ${a.defaultName} me la escriba`}
        </button>
      </form>

      <div className="card relative min-h-[420px] overflow-hidden" aria-live="polite">
        {!result && !busy && (
          <div className="flex h-full min-h-[420px] flex-col items-center justify-center p-6 text-center text-muted">
            <Animal id={animal} size={88} />
            <p className="mt-3">Aquí aparecerá tu newsletter.</p>
          </div>
        )}
        {busy && (
          <div className="flex h-full min-h-[420px] flex-col items-center justify-center p-6 text-center">
            <div className="anim-bob"><Animal id={animal} size={96} /></div>
            <p className="mt-4 font-semibold">{a.defaultName} está escribiendo…</p>
            <div className="mt-5 w-full max-w-xs space-y-2" aria-hidden>
              <div className="shimmer h-3 rounded-full" />
              <div className="shimmer h-3 w-4/5 rounded-full" />
              <div className="shimmer h-3 w-2/3 rounded-full" />
            </div>
          </div>
        )}
        {result && <Mail r={result} />}
      </div>
    </div>
  );
}

function Mail({ r }: { r: { n: Newsletter; animal: AnimalId; source: string } }) {
  const a = ANIMALS[r.animal];
  const { n } = r;
  let i = 0;
  const delay = () => ({ animationDelay: `${(i++) * 110}ms` });
  return (
    <article>
      <div className="h-1.5" style={{ background: a.color }} />
      <div className="border-b border-line px-5 py-3 text-sm">
        <p className="anim-fade-up truncate font-semibold" style={delay()}>{n.subject}</p>
        <p className="anim-fade-up truncate text-muted" style={delay()}>{n.preheader}</p>
      </div>
      <div className="space-y-4 px-5 py-5 font-serif text-[1.02rem] leading-relaxed">
        <p className="anim-fade-up text-xl font-bold" style={delay()}>{n.greeting}</p>
        {n.sections.map((s, k) => (
          <div key={k} className="anim-fade-up" style={delay()}>
            {s.title && <p className="mb-1 font-sans text-[0.7rem] font-bold tracking-[0.14em] uppercase" style={{ color: a.color }}>{s.title}</p>}
            <p className="whitespace-pre-line">{s.body}</p>
          </div>
        ))}
        {n.cta && (
          <p className="anim-fade-up" style={delay()}>
            <span className="inline-block rounded-xl bg-ink px-4 py-2.5 font-sans text-sm font-semibold text-white">{n.cta}</span>
          </p>
        )}
        <p className="anim-fade-up text-[#55525c] italic" style={delay()}>{n.signoff}<br /><span className="font-bold text-ink not-italic">{a.defaultName}</span></p>
      </div>
      <p className="border-t border-line px-5 py-3 text-xs text-muted">
        {r.source === "showcase" ? `Escrita por ${a.defaultName} · estilo ${STYLE[r.animal]}` : r.source === "simulated" ? "Vista rápida (la versión completa escribe mucho mejor al registrarte)" : `Escrita por ${a.defaultName} con IA`}
      </p>
    </article>
  );
}
