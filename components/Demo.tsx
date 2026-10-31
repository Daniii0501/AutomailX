"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  flatten,
  SAMPLE_NOTE,
  TONES,
  type Newsletter,
  type Tone,
} from "@/lib/newsletter";

type Phase = "idle" | "listening" | "thinking" | "writing" | "done" | "sent";

const STEPS = [
  "Escuchando tu nota",
  "Detectando lo importante",
  "Escribiendo con tu tono",
  "Maquetando el correo",
];
const STEP_MS = 650;

// Tipos mínimos de la Web Speech API (no vienen en lib.dom de TypeScript).
type SpeechResultList = ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: SpeechResultList }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecCtor = new () => SpeechRec;

function getSpeechCtor(): SpeechRecCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecCtor;
    webkitSpeechRecognition?: SpeechRecCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Demo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [note, setNote] = useState("");
  const [tone, setTone] = useState<Tone>("cercano");
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [shown, setShown] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const canSpeak = useSyncExternalStore(
    () => () => {},
    () => getSpeechCtor() !== null,
    () => false,
  );

  const recRef = useRef<SpeechRec | null>(null);
  const noteRef = useRef("");
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    noteRef.current = note;
  }, [note]);

  const blocks = useMemo(() => (newsletter ? flatten(newsletter) : []), [newsletter]);
  const total = useMemo(() => blocks.reduce((a, b) => a + b.text.length, 0), [blocks]);

  const generate = useCallback(async (text: string, t: Tone) => {
    setError(null);
    setShown(0);
    setStepIdx(0);
    setPhase("thinking");

    const ticker = (async () => {
      for (let i = 1; i <= STEPS.length; i++) {
        await sleep(STEP_MS);
        setStepIdx(i);
      }
    })();

    try {
      const [res] = await Promise.all([
        fetch("/api/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ note: text, tone: t }),
        }).then((r) => r.json() as Promise<{ newsletter?: Newsletter; error?: string }>),
        ticker,
      ]);
      if (!res.newsletter) {
        setError(res.error ?? "No he podido generar la newsletter.");
        setPhase("idle");
        return;
      }
      setNewsletter(res.newsletter);
      setPhase("writing");
    } catch {
      setError("Algo ha fallado. Inténtalo de nuevo.");
      setPhase("idle");
    }
  }, []);

  // Efecto máquina de escribir.
  useEffect(() => {
    if (phase !== "writing") return;
    const id = setInterval(() => {
      setShown((s) => {
        const next = s + 5;
        if (next >= total) {
          clearInterval(id);
          setPhase("done");
          return total;
        }
        return next;
      });
    }, 22);
    return () => clearInterval(id);
  }, [phase, total]);

  // Auto-scroll mientras se escribe.
  useEffect(() => {
    const el = previewRef.current;
    if (el && phase === "writing") el.scrollTop = el.scrollHeight;
  }, [shown, phase]);

  const startListening = () => {
    const Ctor = getSpeechCtor();
    if (!Ctor) {
      setTyping(true);
      return;
    }
    setError(null);
    setNote("");
    noteRef.current = "";
    const rec = new Ctor();
    rec.lang = "es-ES";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript + " ";
      const clean = text.trim();
      noteRef.current = clean;
      setNote(clean);
    };
    rec.onerror = () => {
      setError("No he podido acceder al micrófono. Puedes escribir tu nota.");
      setTyping(true);
      setPhase("idle");
    };
    rec.onend = () => {
      recRef.current = null;
    };
    recRef.current = rec;
    try {
      rec.start();
      setPhase("listening");
    } catch {
      setTyping(true);
    }
  };

  const stopListening = () => {
    recRef.current?.stop();
    const text = noteRef.current.trim();
    if (text.length < 15) {
      setError("No te he oído bien. Prueba otra vez o escribe tu nota.");
      setTyping(true);
      setPhase("idle");
      return;
    }
    void generate(text, tone);
  };

  const changeTone = (t: Tone) => {
    setTone(t);
    if (phase === "done" && note.trim().length >= 15) void generate(note, t);
  };

  const reset = () => {
    setPhase("idle");
    setNewsletter(null);
    setShown(0);
    setNote("");
    setError(null);
    setTyping(false);
  };

  const useSample = () => {
    setNote(SAMPLE_NOTE);
    noteRef.current = SAMPLE_NOTE;
    setTyping(true);
    void generate(SAMPLE_NOTE, tone);
  };

  // Offsets para revelar el texto bloque a bloque.
  const starts = blocks.reduce<number[]>((arr, b, i) => {
    arr.push(i === 0 ? 0 : arr[i - 1] + blocks[i - 1].text.length);
    return arr;
  }, []);
  const visible = blocks.map((b, idx) => {
    const start = starts[idx];
    const n = Math.max(0, Math.min(b.text.length, shown - start));
    return { ...b, idx, text: b.text.slice(0, n), started: shown > start };
  });
  const lastStarted = visible.reduce((last, b, i) => (b.started ? i : last), -1);
  const subject = visible.find((b) => b.kind === "subject");
  const preheader = visible.find((b) => b.kind === "preheader");
  const bodyBlocks = visible.filter((b) => b.kind !== "subject" && b.kind !== "preheader");

  const showEmail = phase === "writing" || phase === "done" || phase === "sent";

  return (
    <div className="mx-auto w-full max-w-[390px]">
      {/* Selector de tono */}
      <div className="mb-4 flex items-center justify-center gap-2" role="group" aria-label="Tono">
        {TONES.map((t) => (
          <button
            key={t.id}
            onClick={() => changeTone(t.id)}
            disabled={phase === "thinking" || phase === "writing" || phase === "listening"}
            className={`rounded-full px-3.5 py-1.5 text-sm transition disabled:opacity-40 ${
              tone === t.id
                ? "bg-white text-black font-medium"
                : "glass text-muted hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Móvil */}
      <div className="relative mx-auto h-[660px] w-full rounded-[2.6rem] border border-white/15 bg-[#07070b] p-2.5 shadow-[0_30px_120px_-20px_rgba(139,92,246,0.55)]">
        <div className="relative flex h-full flex-col overflow-hidden rounded-[2.1rem] bg-bg-soft">
          <div className="absolute left-1/2 top-2 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
          <div className="h-10 shrink-0" />

          {/* IDLE */}
          {phase === "idle" && (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center anim-fade-up">
              {!typing ? (
                <>
                  <button
                    onClick={startListening}
                    aria-label="Empezar a grabar tu nota de voz"
                    className="relative grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-accent to-[#6d3df0] shadow-[0_0_60px_rgba(139,92,246,0.6)] transition hover:scale-105 active:scale-95"
                  >
                    <span className="anim-ring absolute inset-0 rounded-full bg-accent/50" />
                    <MicIcon className="relative h-11 w-11 text-white" />
                  </button>
                  <p className="mt-7 text-xl font-semibold">Cuenta tu semana</p>
                  <p className="mt-1.5 text-sm text-muted">
                    Habla 30 segundos. Yo escribo la newsletter.
                  </p>
                </>
              ) : (
                <div className="w-full text-left">
                  <label htmlFor="note" className="mb-2 block text-sm font-medium">
                    Escribe lo que ha pasado esta semana
                  </label>
                  <textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={7}
                    placeholder="Ej.: Esta semana lanzamos… además el viernes hacemos…"
                    className="w-full resize-none rounded-2xl border border-line bg-black/30 p-3.5 text-[15px] leading-relaxed outline-none placeholder:text-muted/70 focus:border-accent"
                  />
                  <button
                    onClick={() => void generate(note, tone)}
                    disabled={note.trim().length < 15}
                    className="mt-3 w-full rounded-2xl bg-white py-3 text-[15px] font-semibold text-black transition disabled:opacity-35"
                  >
                    Crear newsletter
                  </button>
                </div>
              )}

              {error && (
                <p role="alert" className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </p>
              )}

              <div className="mt-6 flex flex-col items-center gap-2 text-sm">
                <button onClick={useSample} className="text-accent underline-offset-4 hover:underline">
                  Probar con un ejemplo
                </button>
                {canSpeak && (
                  <button
                    onClick={() => setTyping((v) => !v)}
                    className="text-muted underline-offset-4 hover:text-text hover:underline"
                  >
                    {typing ? "Prefiero hablar" : "Prefiero escribir"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ESCUCHANDO */}
          {phase === "listening" && (
            <div className="flex flex-1 flex-col items-center px-6 pb-8 pt-6 text-center">
              <div className="flex h-14 items-center gap-1.5" aria-hidden>
                {Array.from({ length: 15 }).map((_, i) => (
                  <span
                    key={i}
                    className="bar h-full w-1.5 rounded-full bg-gradient-to-t from-accent to-accent-2"
                    style={{ animationDelay: `${(i % 7) * 0.11}s`, animationDuration: `${0.7 + (i % 5) * 0.12}s` }}
                  />
                ))}
              </div>
              <p className="mt-4 text-sm text-muted">Te escucho…</p>
              <div className="no-scrollbar mt-4 w-full flex-1 overflow-y-auto rounded-2xl border border-line bg-black/25 p-4 text-left text-[15px] leading-relaxed">
                {note || <span className="text-muted/70">Empieza a hablar con naturalidad.</span>}
                <span className="anim-caret ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-accent" />
              </div>
              <button
                onClick={stopListening}
                className="mt-5 flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:scale-[1.03] active:scale-95"
              >
                <span className="h-3 w-3 rounded-sm bg-black" /> Terminar y crear
              </button>
            </div>
          )}

          {/* PENSANDO */}
          {phase === "thinking" && (
            <div className="flex flex-1 flex-col px-6 pb-8 pt-4 anim-fade-up">
              <ul className="mt-6 space-y-3.5">
                {STEPS.map((s, i) => {
                  const done = stepIdx > i;
                  const current = stepIdx === i;
                  return (
                    <li
                      key={s}
                      className={`flex items-center gap-3 text-[15px] transition ${
                        done ? "text-text" : current ? "text-text" : "text-muted/50"
                      }`}
                    >
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-full border text-xs ${
                          done
                            ? "anim-pop border-ok bg-ok/15 text-ok"
                            : current
                              ? "border-accent"
                              : "border-line"
                        }`}
                      >
                        {done ? "✓" : current ? <span className="h-2 w-2 animate-pulse rounded-full bg-accent" /> : ""}
                      </span>
                      {s}
                    </li>
                  );
                })}
              </ul>
              <div className="mt-8 space-y-3">
                <div className="shimmer h-5 w-3/4 rounded-md" />
                <div className="shimmer h-3 w-full rounded-md" />
                <div className="shimmer h-3 w-11/12 rounded-md" />
                <div className="shimmer h-3 w-4/5 rounded-md" />
                <div className="shimmer mt-5 h-5 w-1/2 rounded-md" />
                <div className="shimmer h-3 w-full rounded-md" />
                <div className="shimmer h-3 w-2/3 rounded-md" />
              </div>
            </div>
          )}

          {/* EMAIL */}
          {showEmail && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="shrink-0 border-b border-line px-5 pb-3 pt-1">
                <p className="text-xs text-muted">
                  De <span className="text-text">Tu Negocio</span> · Para 3 suscriptores
                </p>
                <p className="mt-1 text-[15px] font-semibold leading-snug">
                  {subject?.text}
                  {phase === "writing" && lastStarted === 0 && (
                    <span className="anim-caret ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-accent" />
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted">{preheader?.text}</p>
              </div>

              <div ref={previewRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto bg-[#f6f3ee] px-6 py-6 text-[#1b1a1f]">
                <div className="mb-5 h-1.5 w-12 rounded-full bg-gradient-to-r from-accent to-accent-2" />
                {bodyBlocks.map((b, i) => {
                  if (!b.started) return null;
                  const cursor = phase === "writing" && b.idx === lastStarted ? (
                    <span className="anim-caret ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-accent" />
                  ) : null;
                  if (b.kind === "greeting")
                    return (
                      <p key={i} className="mb-4 font-serif text-lg font-semibold">
                        {b.text}
                        {cursor}
                      </p>
                    );
                  if (b.kind === "h")
                    return (
                      <h3 key={i} className="mb-1 mt-5 text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
                        {b.text}
                        {cursor}
                      </h3>
                    );
                  if (b.kind === "p")
                    return (
                      <p key={i} className="font-serif text-[16px] leading-[1.65]">
                        {b.text}
                        {cursor}
                      </p>
                    );
                  if (b.kind === "cta")
                    return (
                      <div key={i} className="mt-6">
                        <span className="inline-block rounded-xl bg-[#1b1a1f] px-4 py-2.5 text-sm font-semibold text-white">
                          {b.text}
                          {cursor}
                        </span>
                      </div>
                    );
                  return (
                    <p key={i} className="mt-6 font-serif text-[15px] italic text-[#55525c]">
                      {b.text}
                      {cursor}
                    </p>
                  );
                })}
              </div>

              <div className="shrink-0 border-t border-line bg-bg-soft px-5 py-4">
                {phase === "sent" ? (
                  <div className="anim-fade-up text-center">
                    <div className="anim-pop mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-ok/15 text-xl text-ok">
                      ✓
                    </div>
                    <p className="text-sm font-semibold">Enviada a 3 suscriptores de ejemplo</p>
                    <p className="mt-0.5 text-xs text-muted">Es una demo: no se ha enviado ningún correo real.</p>
                    <button onClick={reset} className="mt-3 text-sm text-accent underline-offset-4 hover:underline">
                      Crear otra
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPhase("sent")}
                      disabled={phase !== "done"}
                      className="flex-1 rounded-2xl bg-white py-3 text-[15px] font-semibold text-black transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40"
                    >
                      Enviar ahora →
                    </button>
                    <button
                      onClick={() => void generate(note, tone)}
                      disabled={phase !== "done"}
                      aria-label="Regenerar"
                      className="glass rounded-2xl px-4 text-lg transition hover:bg-white/10 disabled:opacity-40"
                    >
                      ↻
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5 11.5a7 7 0 0 0 14 0M12 18.5V22" />
    </svg>
  );
}
