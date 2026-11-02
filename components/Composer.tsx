"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WriterAvatar from "@/components/WriterAvatar";
import { useSpeech } from "@/components/useSpeech";
import type { AnimalId } from "@/lib/animals";
import { api } from "@/lib/client";
import { FORMAT_IDS, FORMATS, type FormatId } from "@/lib/formats";
import { lookOf } from "@/lib/look";

export type ComposerWriter = {
  id: string;
  name: string;
  kind: "animal" | "custom";
  animal: AnimalId;
  avatar: string;
  color: string;
  format: FormatId;
};

export default function Composer({ writer }: { writer: ComposerWriter }) {
  const router = useRouter();
  const look = lookOf(writer);
  const [text, setText] = useState("");
  const [format, setFormat] = useState<FormatId>(writer.format);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phrase, setPhrase] = useState(0);

  const onText = useCallback((t: string) => setText(t), []);
  const speech = useSpeech(onText);

  const phrases = [
    `${writer.name} está leyendo tus notas…`,
    `${writer.name} busca el gancho…`,
    `${writer.name} está escribiendo…`,
    `${writer.name} pule cada frase…`,
  ];

  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => setPhrase((p) => (p + 1) % phrases.length), 1600);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);

  async function submit() {
    if (speech.listening) speech.stop();
    setBusy(true);
    setError(null);
    const r = await api<{ id?: string }>("/api/newsletters", "POST", { writerId: writer.id, brief: text, format });
    if (!r.ok || !r.data.id) {
      setBusy(false);
      setError(r.data.error ?? "No se pudo crear el borrador.");
      return;
    }
    router.push(`/panel/n/${r.data.id}`);
  }

  if (busy) {
    return (
      <div className="card anim-fade-up flex flex-col items-center px-6 py-16 text-center" style={{ background: `linear-gradient(160deg, ${look.soft}, #fff 75%)` }}>
        <WriterAvatar w={writer} size={120} className="anim-bob" />
        <p className="mt-6 text-lg font-medium">{phrases[phrase]}</p>
        <p className="mt-1 text-sm text-muted">Estilo: {FORMATS[format].label}. Puede tardar unos segundos.</p>
        <div className="mt-6 w-full max-w-xs space-y-2.5">
          <div className="shimmer h-3 w-full rounded-full" />
          <div className="shimmer h-3 w-4/5 rounded-full" />
          <div className="shimmer h-3 w-2/3 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden" style={{ background: `linear-gradient(160deg, ${look.soft}, #fff 55%)` }}>
      <div className="flex items-center gap-4 px-6 pt-6 sm:px-8 sm:pt-8">
        <WriterAvatar w={writer} size={84} className="shrink-0" />
        <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 text-[15px] shadow-sm">
          <b>{writer.name}</b>: «¿Qué cuentas hoy? Dímelo como si fuera a un amigo.»
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <div className="relative">
          <label htmlFor="brief" className="sr-only">Cuéntale a {writer.name} lo que ha pasado</label>
          <textarea
            id="brief"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Esta semana lanzamos… además el viernes hacemos… quiero agradecer a…"
            className="input resize-none pr-16 text-[17px] leading-relaxed"
          />
          {speech.supported && (
            <button
              type="button"
              onClick={() => (speech.listening ? speech.stop() : speech.start())}
              aria-label={speech.listening ? "Parar de grabar" : "Dictar con la voz"}
              aria-pressed={speech.listening}
              className="absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-full text-white shadow-md transition active:scale-95"
              style={{ background: speech.listening ? "#d6405a" : look.color }}
            >
              {speech.listening && <span className="anim-ring absolute inset-0 rounded-full bg-danger/40" />}
              <svg viewBox="0 0 24 24" className="relative h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="9" y="2.5" width="6" height="11" rx="3" />
                <path d="M5 11.5a7 7 0 0 0 14 0M12 18.5V22" />
              </svg>
            </button>
          )}
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium">Estilo de la newsletter</p>
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Estilo de la newsletter">
            {FORMAT_IDS.map((f) => (
              <button key={f} type="button" aria-pressed={format === f} onClick={() => setFormat(f)} className="chip shrink-0 whitespace-nowrap">
                <span aria-hidden>{FORMATS[f].emoji}</span> {FORMATS[f].label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted">{FORMATS[format].hint}</p>
        </div>

        {(error || speech.error) && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">
            {error ?? speech.error}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {speech.listening ? "Te escucho… pulsa el micro cuando acabes." : "Puedes dictarlo con el micrófono o escribirlo."}
          </p>
          <button onClick={submit} disabled={text.trim().length < 15} className="btn btn-primary !px-7 !py-3.5">
            Que {writer.name} la escriba
          </button>
        </div>
      </div>
    </div>
  );
}
