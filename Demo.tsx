"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Animal from "@/components/Animal";
import { useSpeech } from "@/components/useSpeech";
import { ANIMAL_IDS, ANIMALS, type AnimalId } from "@/lib/animals";
import { api } from "@/lib/client";
import { flatten, SAMPLE_NOTE, type Newsletter } from "@/lib/newsletter";

type Phase = "pick" | "brief" | "listening" | "thinking" | "writing" | "done";

const STEP_MS = 650;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Demo() {
  const [phase, setPhase] = useState<Phase>("pick");
  const [animal, setAnimal] = useState<AnimalId>("zorro");
  const [note, setNote] = useState("");
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [shown, setShown] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const noteRef = useRef("");
  const previewRef = useRef<HTMLDivElement | null>(null);

  const a = ANIMALS[animal];
  const steps = useMemo(
    () => [`${a.defaultName} lee tu nota`, "Elige lo más importante", `Escribe con voz de ${a.species.toLowerCase()}`, "Maqueta el correo"],
    [a],
  );

  const onText = useCallback((t: string) => {
    noteRef.current = t;
    setNote(t);
  }, []);
  const speech = useSpeech(onText);

  const blocks = useMemo(() => (newsletter ? flatten(newsletter) : []), [newsletter]);
  const total = useMemo(() => blocks.reduce((s, b) => s + b.text.length, 0), [blocks]);

  const generate = useCallback(
    async (text: string, an: AnimalId) => {
      setError(null);
      setShown(0);
      setStepIdx(0);
      setPhase("thinking");
      const ticker = (async () => {
        for (let i = 1; i <= 4; i++) {
          await sleep(STEP_MS);
          setStepIdx(i);
        }
      })();
      const [res] = await Promise.all([api<{ newsletter?: Newsletter }>("/api/generate", "POST", { note: text, animal: an }), ticker]);
      if (!res.ok || !res.data.newsletter) {
        setError(res.data.error ?? "No he podido escribirla. Inténtalo de nuevo.");
        setPhase("brief");
        return;
      }
      setNewsletter(res.data.newsletter);
      setPhase("writing");
    },
    [],
  );

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

  useEffect(() => {
    const el = previewRef.current;
    if (el && phase === "writing") el.scrollTop = el.scrollHeight;
  }, [shown, phase]);

  const pick = (id: AnimalId) => {
    setAnimal(id);
    setNote("");
    noteRef.current = "";
    setError(null);
    setTyping(false);
    setPhase("brief");
  };

  const startVoice = () => {
    setNote("");
    noteRef.current = "";
    if (speech.start()) setPhase("listening");
    else setTyping(true);
  };

  const stopVoice = () => {
    speech.stop();
    const t = noteRef.current.trim();
    if (t.length < 15) {
      setError("No te he oído bien. Prueba otra vez o escribe tu nota.");
      setTyping(true);
      setPhase("brief");
      return;
    }
    void generate(t, animal);
  };

  // Offsets para revelar el texto bloque a bloque.
  const starts = blocks.reduce<number[]>((arr, b, i) => {
    arr.push(i === 0 ? 0 : arr[i - 1] + blocks[i - 1].text.length);
    return arr;
  }, []);
  const visible = blocks.map((b, idx) => {
    const n = Math.max(0, Math.min(b.text.length, shown - starts[idx]));
    return { ...b, idx, text: b.text.slice(0, n), started: shown > starts[idx] };
  });
  const lastStarted = visible.reduce((last, b, i) => (b.started ? i : last), -1);
  const subject = visible.find((b) => b.kind === "subject");
  const preheader = visible.find((b) => b.kind === "preheader");
  const body = visible.filter((b) => b.kind !== "subject" && b.kind !== "preheader");
  const showEmail = phase === "writing" || phase === "done";
  const caret = <span className="anim-caret ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-brand" />;

  return (
    <div className="mx-auto w-full max-w-[390px]">
      <div className="relative mx-auto h-[660px] w-full rounded-[2.6rem] border border-black/10 bg-[#101014] p-2.5 shadow-[0_40px_100px_-30px_rgba(109,74,255,0.45)]">
        <div className="relative flex h-full flex-col overflow-hidden rounded-[2.1rem]" style={{ background: showEmail ? "#fff" : a.soft, transition: "background .4s" }}>
          <div className="absolute left-1/2 top-2 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
          <div className="h-10 shrink-0" />

          {/* 1. ELEGIR ANIMAL */}
          {phase === "pick" && (
            <div className="anim-fade-up flex flex-1 flex-col px-5 pb-6 pt-3 text-center" style={{ background: "#fbfaf8" }}>
              <p className="text-xl font-semibold tracking-tight">Elige a tu redactor</p>
              <p className="mt-1 text-sm text-muted">Cada uno escribe a su manera.</p>
              <div className="mt-5 grid flex-1 grid-cols-2 content-start gap-3">
                {ANIMAL_IDS.map((id) => (
                  <button
                    key={id}
                    onClick={() => pick(id)}
                    className="group rounded-3xl border border-line bg-white p-3 text-center transition hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
                  >
                    <Animal id={id} size={74} className="mx-auto transition group-hover:scale-105" />
                    <p className="mt-1.5 text-[15px] font-semibold">{ANIMALS[id].species}</p>
                    <p className="text-xs leading-tight text-muted">{ANIMALS[id].tagline}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. CONTARLE LA SEMANA */}
          {phase === "brief" && (
            <div className="anim-fade-up flex flex-1 flex-col items-center px-6 pb-6 pt-2 text-center">
              <button onClick={() => setPhase("pick")} className="self-start text-sm text-muted hover:text-ink">
                ← Cambiar
              </button>
              <Animal id={animal} size={96} className="mt-1" />
              <div className="mt-3 rounded-2xl bg-white px-4 py-2.5 text-[15px] shadow-sm">
                Soy <b>{a.defaultName}</b>, tu {a.species.toLowerCase()}. {typing ? "Escríbeme qué ha pasado." : "Cuéntame tu semana."}
              </div>

              {!typing ? (
                <button
                  onClick={startVoice}
                  aria-label="Empezar a grabar tu nota de voz"
                  className="relative mt-8 grid h-24 w-24 place-items-center rounded-full text-white shadow-xl transition hover:scale-105 active:scale-95"
                  style={{ background: a.color }}
                >
                  <span className="anim-ring absolute inset-0 rounded-full" style={{ background: a.color, opacity: 0.4 }} />
                  <svg viewBox="0 0 24 24" className="relative h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="9" y="2.5" width="6" height="11" rx="3" />
                    <path d="M5 11.5a7 7 0 0 0 14 0M12 18.5V22" />
                  </svg>
                </button>
              ) : (
                <div className="mt-4 w-full text-left">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={6}
                    aria-label="Tu nota"
                    placeholder="Esta semana lanzamos…"
                    className="input resize-none text-[15px] leading-relaxed"
                  />
                  <button onClick={() => void generate(note, animal)} disabled={note.trim().length < 15} className="btn btn-primary mt-3 w-full">
                    Que escriba {a.defaultName}
                  </button>
                </div>
              )}

              {error && (
                <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">
                  {error}
                </p>
              )}

              <div className="mt-5 flex flex-col items-center gap-2 text-sm">
                <button
                  onClick={() => {
                    setNote(SAMPLE_NOTE);
                    noteRef.current = SAMPLE_NOTE;
                    void generate(SAMPLE_NOTE, animal);
                  }}
                  className="font-medium text-brand hover:underline"
                >
                  Probar con un ejemplo
                </button>
                {speech.supported && (
                  <button onClick={() => setTyping((v) => !v)} className="text-muted hover:text-ink hover:underline">
                    {typing ? "Prefiero hablar" : "Prefiero escribir"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 3. ESCUCHANDO */}
          {phase === "listening" && (
            <div className="flex flex-1 flex-col items-center px-6 pb-7 pt-4 text-center">
              <Animal id={animal} size={84} className="anim-bob" />
              <div className="mt-4 flex h-12 items-center gap-1.5" aria-hidden>
                {Array.from({ length: 15 }).map((_, i) => (
                  <span key={i} className="bar h-full w-1.5 rounded-full" style={{ background: a.color, animationDelay: `${(i % 7) * 0.11}s`, animationDuration: `${0.7 + (i % 5) * 0.12}s` }} />
                ))}
              </div>
              <p className="mt-2 text-sm text-muted">{a.defaultName} te escucha…</p>
              <div className="no-scrollbar mt-4 w-full flex-1 overflow-y-auto rounded-2xl bg-white p-4 text-left text-[15px] leading-relaxed shadow-sm">
                {note || <span className="text-muted">Empieza a hablar con naturalidad.</span>}
                {caret}
              </div>
              <button onClick={stopVoice} className="btn btn-primary mt-5">
                <span className="h-3 w-3 rounded-sm bg-white" /> Terminar
              </button>
            </div>
          )}

          {/* 4. PENSANDO */}
          {phase === "thinking" && (
            <div className="anim-fade-up flex flex-1 flex-col items-center px-7 pb-8 pt-4">
              <Animal id={animal} size={92} className="anim-bob" />
              <ul className="mt-6 w-full space-y-3.5">
                {steps.map((s, i) => {
                  const done = stepIdx > i;
                  const current = stepIdx === i;
                  return (
                    <li key={s} className={`flex items-center gap-3 text-[15px] transition ${done || current ? "text-ink" : "text-muted/60"}`}>
                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs ${done ? "anim-pop border-ok bg-ok/15 text-ok" : current ? "border-brand bg-white" : "border-line bg-white"}`}>
                        {done ? "✓" : current ? <span className="h-2 w-2 animate-pulse rounded-full bg-brand" /> : ""}
                      </span>
                      {s}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* 5. EL CORREO */}
          {showEmail && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex shrink-0 items-center gap-2.5 border-b border-line px-5 pb-3 pt-1">
                <Animal id={animal} size={34} />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold leading-snug">
                    {subject?.text}
                    {phase === "writing" && lastStarted === 0 && caret}
                  </p>
                  <p className="truncate text-xs text-muted">{preheader?.text}</p>
                </div>
              </div>
              <div ref={previewRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto bg-[#f6f3ee] px-6 py-6 text-[#1b1a1f]">
                <div className="mb-5 h-1.5 w-12 rounded-full" style={{ background: a.color }} />
                {body.map((b, i) => {
                  if (!b.started) return null;
                  const cursor = phase === "writing" && b.idx === lastStarted ? caret : null;
                  if (b.kind === "greeting") return <p key={i} className="mb-4 font-serif text-lg font-semibold">{b.text}{cursor}</p>;
                  if (b.kind === "h") return <h3 key={i} className="mb-1 mt-5 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: a.color }}>{b.text}{cursor}</h3>;
                  if (b.kind === "p") return <p key={i} className="font-serif text-[16px] leading-[1.65]">{b.text}{cursor}</p>;
                  if (b.kind === "cta") return <div key={i} className="mt-6"><span className="inline-block rounded-xl bg-[#1b1a1f] px-4 py-2.5 text-sm font-semibold text-white">{b.text}{cursor}</span></div>;
                  return <p key={i} className="mt-6 font-serif text-[15px] italic text-[#55525c]">{b.text}{cursor}</p>;
                })}
              </div>
              <div className="shrink-0 border-t border-line bg-white px-5 py-4">
                <div className="flex gap-2">
                  <Link href="/login" className="btn btn-primary flex-1" aria-disabled={phase !== "done"} style={phase !== "done" ? { opacity: 0.4, pointerEvents: "none" } : undefined}>
                    Quiero el mío →
                  </Link>
                  <button onClick={() => setPhase("pick")} disabled={phase !== "done"} aria-label="Probar con otro animal" className="btn btn-soft px-4">
                    ↺
                  </button>
                </div>
                <p className="mt-2 text-center text-xs text-muted">Esto es una demo. Con tu cuenta, {a.defaultName} escribe con tu estilo.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
