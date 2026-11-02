"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { FORMATS, FORMAT_IDS, type FormatId } from "@/lib/formats";
import type { Look } from "@/lib/newsletter";
import { useSpeech } from "./useSpeech";
import WriterAvatar from "./WriterAvatar";

export type WriterLite = { id: string; name: string; look: Look; format: FormatId; tagline: string };

const STEPS = ["Leyendo tus notas…", "Buscando el ángulo…", "Escribiendo el borrador…", "Puliendo el asunto…", "Repasando que no se invente nada…", "Últimos retoques…"];

export default function Composer({ writers }: { writers: WriterLite[] }) {
  const router = useRouter();
  const [writerId, setWriterId] = useState(writers[0]?.id ?? "");
  const [brief, setBrief] = useState("");
  const [format, setFormat] = useState<FormatId>("auto");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const speech = useSpeech((t) => setBrief((b) => (b ? `${b.trimEnd()} ${t}` : t)));
  const writer = writers.find((w) => w.id === writerId) ?? writers[0];

  useEffect(() => {
    if (!busy) return;
    setStep(0);
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 9000);
    return () => clearInterval(id);
  }, [busy]);

  async function write(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (brief.trim().length < 20) {
      setError("Cuéntale un poco más: una o dos frases sobre lo que ha pasado.");
      return;
    }
    setBusy(true);
    try {
      const r = await api<{ id: string }>("/api/newsletters", { body: { writerId: writer.id, brief, format } });
      router.push(`/panel/n/${r.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo ha fallado.");
      setBusy(false);
    }
  }

  if (busy && writer) {
    return (
      <div className="card flex flex-col items-center px-6 py-14 text-center" aria-live="polite">
        <div className="anim-bob">
          <WriterAvatar look={writer.look} size={96} />
        </div>
        <p className="mt-5 text-lg font-semibold">{writer.name} está escribiendo</p>
        <p className="mt-1 text-muted">{STEPS[step]}</p>
        <div className="mt-6 w-full max-w-xs space-y-2" aria-hidden>
          <div className="shimmer h-3 rounded-full" />
          <div className="shimmer h-3 w-4/5 rounded-full" />
          <div className="shimmer h-3 w-3/5 rounded-full" />
        </div>
        <p className="hint mt-6">Suele tardar entre 20 y 60 segundos. No cierres esta pantalla.</p>
      </div>
    );
  }

  return (
    <form onSubmit={write} className="card p-5 sm:p-6">
      {writers.length > 1 && (
        <fieldset className="mb-5">
          <legend className="label">¿Quién escribe hoy?</legend>
          <div className="flex flex-wrap gap-2">
            {writers.map((w) => (
              <button
                type="button"
                key={w.id}
                onClick={() => setWriterId(w.id)}
                aria-pressed={w.id === writer.id}
                className="chip inline-flex items-center gap-2 !py-1.5 !pl-1.5"
              >
                <WriterAvatar look={w.look} size={28} />
                {w.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex items-start gap-3">
        <WriterAvatar look={writer.look} size={44} />
        <div>
          <p className="font-semibold">Cuéntale a {writer.name} qué ha pasado</p>
          <p className="text-sm text-muted">Tal cual te salga: tú pones los hechos, {writer.name} pone el oficio.</p>
        </div>
      </div>

      <div className="relative mt-4">
        <label htmlFor="brief" className="sr-only">Tus notas</label>
        <textarea
          id="brief"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={6}
          maxLength={4000}
          placeholder="Ej.: Esta semana hemos abierto los sábados por la mañana. El viernes hay taller gratis a las 18:00. Quiero dar las gracias a quien vino a la presentación…"
          className="input pb-12"
        />
        {speech.supported && (
          <button
            type="button"
            onClick={speech.toggle}
            className={`absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${speech.listening ? "bg-danger text-white" : "bg-[#f4f2ef] text-ink hover:bg-[#ebe8e3]"}`}
            aria-pressed={speech.listening}
          >
            <span aria-hidden className="relative inline-flex h-2.5 w-2.5">
              {speech.listening && <span className="anim-ring absolute inset-0 rounded-full bg-white" />}
              <span className={`relative h-2.5 w-2.5 rounded-full ${speech.listening ? "bg-white" : "bg-danger"}`} />
            </span>
            {speech.listening ? "Parar" : "Dictar"}
          </button>
        )}
      </div>
      {speech.error && <p className="hint text-danger">{speech.error}</p>}

      <fieldset className="mt-5">
        <legend className="label">Estilo</legend>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap">
          {FORMAT_IDS.map((id) => (
            <button type="button" key={id} className="chip shrink-0" aria-pressed={format === id} onClick={() => setFormat(id)} title={FORMATS[id].hint}>
              <span aria-hidden>{FORMATS[id].emoji}</span> {id === "auto" ? (writer.format !== "auto" ? `El de ${writer.name}` : "Que decida") : FORMATS[id].label}
            </button>
          ))}
        </div>
        <p className="hint">{format === "auto" && writer.format !== "auto" ? `Usará su estilo habitual: ${FORMATS[writer.format].label}.` : FORMATS[format].hint}.</p>
      </fieldset>

      {error && <p role="alert" className="banner banner-err mt-4">{error}</p>}

      <button type="submit" className="btn btn-primary mt-5 w-full sm:w-auto">
        Escribir newsletter
      </button>
    </form>
  );
}
