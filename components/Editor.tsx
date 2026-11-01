"use client";

import Link from "next/link";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Animal from "@/components/Animal";
import { useSpeech } from "@/components/useSpeech";
import { ANIMALS, type AnimalId } from "@/lib/animals";
import { api } from "@/lib/client";
import type { Newsletter } from "@/lib/newsletter";

type Props = {
  id: string;
  status: string;
  delivery: string | null;
  recipients: number;
  sentAt: number | null;
  initial: Newsletter;
  brief: string;
  writer: { name: string; animal: AnimalId };
  publicationName: string;
  confirmed: number;
  userEmail: string;
};

const QUICK = ["Más corto", "Más cercano", "Más formal", "Con más gancho", "Añade una llamada a la acción"];

function AutoText({
  value,
  onChange,
  readOnly,
  className = "",
  label,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  readOnly: boolean;
  className?: string;
  label: string;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      readOnly={readOnly}
      placeholder={placeholder}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
      className={`block w-full resize-none overflow-hidden rounded-md bg-transparent outline-none transition ${readOnly ? "" : "hover:bg-black/[0.03] focus:bg-black/[0.04]"} ${className}`}
    />
  );
}

export default function Editor(p: Props) {
  const router = useRouter();
  const a = ANIMALS[p.writer.animal];
  const readOnly = p.status !== "draft";

  const [n, setN] = useState<Newsletter>(p.initial);
  const latest = useRef<Newsletter>(p.initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  const [save, setSave] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");

  const [instruction, setInstruction] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [revising, setRevising] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);

  const flush = useCallback(async (): Promise<boolean> => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (!dirty.current) return true;
    setSave("saving");
    const r = await api(`/api/newsletters/${p.id}`, "PATCH", { content: latest.current });
    if (r.ok) dirty.current = false;
    setSave(r.ok ? "saved" : "error");
    if (!r.ok) setError(r.data.error ?? "No se pudo guardar.");
    return r.ok;
  }, [p.id]);

  function edit(next: Newsletter) {
    setN(next);
    latest.current = next;
    dirty.current = true;
    setSave("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 800);
  }

  const onText = useCallback((t: string) => setInstruction(t), []);
  const speech = useSpeech(onText);

  async function revise(text: string) {
    const t = text.trim();
    if (t.length < 3 || revising) return;
    if (speech.listening) speech.stop();
    setError(null);
    if (!(await flush())) return;
    setRevising(true);
    const r = await api<{ content?: Newsletter }>(`/api/newsletters/${p.id}/revise`, "POST", { instruction: t });
    setRevising(false);
    if (!r.ok || !r.data.content) {
      setError(r.data.error ?? "No se pudo aplicar el cambio.");
      return;
    }
    setN(r.data.content);
    latest.current = r.data.content;
    dirty.current = false;
    setSave("saved");
    setHistory((h) => [t, ...h].slice(0, 5));
    setInstruction("");
  }

  async function sendTest() {
    setError(null);
    if (!(await flush())) return;
    setTesting(true);
    const r = await api<{ demo?: boolean; to?: string }>(`/api/newsletters/${p.id}/send`, "POST", { mode: "test" });
    setTesting(false);
    if (!r.ok) return setError(r.data.error ?? "No se pudo enviar la prueba.");
    setToast(r.data.demo ? "Modo demo: la prueba no se ha enviado de verdad." : `Prueba enviada a ${r.data.to}`);
    setTimeout(() => setToast(null), 4500);
  }

  async function sendAll() {
    setError(null);
    if (!(await flush())) {
      setConfirm(false);
      return;
    }
    setSending(true);
    const r = await api(`/api/newsletters/${p.id}/send`, "POST", { mode: "all" });
    setSending(false);
    setConfirm(false);
    if (!r.ok) return setError(r.data.error ?? "No se pudo enviar.");
    router.refresh();
  }

  const setSection = (i: number, k: "title" | "body", v: string) =>
    edit({ ...n, sections: n.sections.map((s, j) => (j === i ? { ...s, [k]: v } : s)) });

  const sentDate = p.sentAt ? new Date(p.sentAt).toLocaleString("es-ES", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div>
      <Link href="/panel" className="mb-5 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">← Volver</Link>

      {readOnly && (
        <div className="card anim-fade-up mb-6 flex items-start gap-4 p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ok/15 text-ok">✓</span>
          <div>
            <p className="font-semibold">
              {p.status === "sending" ? "Se está enviando…" : `Enviada a ${p.recipients} ${p.recipients === 1 ? "persona" : "personas"}`}
            </p>
            <p className="text-sm text-muted">
              {sentDate}
              {p.delivery === "demo" && " · Modo demo: no se ha enviado ningún correo real."}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* ---- El correo ---- */}
        <div>
          <div className="card mb-4 space-y-3 p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Asunto</p>
              <AutoText value={n.subject} readOnly={readOnly} label="Asunto" onChange={(v) => edit({ ...n, subject: v.replace(/\n/g, " ") })} className="mt-1 text-lg font-semibold leading-snug" />
            </div>
            <div className="border-t border-line pt-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Vista previa</p>
              <AutoText value={n.preheader} readOnly={readOnly} label="Vista previa" onChange={(v) => edit({ ...n, preheader: v.replace(/\n/g, " ") })} className="mt-1 text-sm text-muted" />
            </div>
          </div>

          <article className="overflow-hidden rounded-3xl border border-line bg-[#f6f3ee] shadow-sm">
            <div className="h-1.5" style={{ background: a.color }} />
            <div className="px-6 py-8 text-[#1b1a1f] sm:px-10">
              <p className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-[#6b6b76]">
                <span aria-hidden>{a.emoji}</span> {p.publicationName}
              </p>
              <AutoText value={n.greeting} readOnly={readOnly} label="Saludo" onChange={(v) => edit({ ...n, greeting: v })} className="mb-3 font-serif text-2xl font-bold leading-snug" />

              {n.sections.map((s, i) => (
                <section key={i} className="group relative mt-6">
                  <AutoText value={s.title} readOnly={readOnly} label={`Título de la sección ${i + 1}`} placeholder="Título (opcional)" onChange={(v) => setSection(i, "title", v)} className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em]" />
                  <AutoText value={s.body} readOnly={readOnly} label={`Texto de la sección ${i + 1}`} onChange={(v) => setSection(i, "body", v)} className="font-serif text-[17px] leading-[1.7]" />
                  {!readOnly && n.sections.length > 1 && (
                    <button onClick={() => edit({ ...n, sections: n.sections.filter((_, j) => j !== i) })} aria-label={`Quitar sección ${i + 1}`} className="absolute -right-2 -top-2 hidden h-6 w-6 place-items-center rounded-full bg-white text-xs text-muted shadow ring-1 ring-black/10 hover:text-danger group-hover:grid">
                      ×
                    </button>
                  )}
                </section>
              ))}

              {!readOnly && n.sections.length < 8 && (
                <button onClick={() => edit({ ...n, sections: [...n.sections, { title: "", body: "Escribe aquí…" }] })} className="mt-5 text-sm text-muted hover:text-ink">
                  + Añadir sección
                </button>
              )}

              <div className="mt-8">
                <span className="inline-block rounded-xl bg-[#1b1a1f] px-4 py-2.5 text-sm font-semibold text-white">
                  <AutoText value={n.cta} readOnly={readOnly} label="Texto del botón" placeholder="Texto del botón" onChange={(v) => edit({ ...n, cta: v })} className="!text-white" />
                </span>
                {!readOnly && (
                  <input value={n.ctaUrl ?? ""} onChange={(e) => edit({ ...n, ctaUrl: e.target.value })} placeholder="Enlace del botón (opcional, empieza por https://)" aria-label="Enlace del botón" className="mt-2 block w-full rounded-lg bg-white/70 px-3 py-2 text-sm outline-none ring-1 ring-black/5 focus:ring-brand/40" />
                )}
              </div>

              <AutoText value={n.signoff} readOnly={readOnly} label="Despedida" onChange={(v) => edit({ ...n, signoff: v })} className="mt-8 font-serif text-[16px] italic text-[#55525c]" />
            </div>
          </article>
        </div>

        {/* ---- Panel lateral ---- */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          {!readOnly ? (
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <Animal id={p.writer.animal} size={48} className={revising ? "anim-bob" : ""} />
                <div>
                  <p className="font-semibold">{revising ? `${p.writer.name} está en ello…` : `Pídele cambios a ${p.writer.name}`}</p>
                  <p className="text-xs text-muted">O edita el texto directamente.</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {QUICK.map((q) => (
                  <button key={q} disabled={revising} onClick={() => void revise(q)} className="chip">{q}</button>
                ))}
              </div>

              <form onSubmit={(e) => { e.preventDefault(); void revise(instruction); }} className="relative mt-4">
                <label htmlFor="inst" className="sr-only">Pide un cambio</label>
                <input id="inst" value={instruction} onChange={(e) => setInstruction(e.target.value)} disabled={revising} placeholder="Ej.: menciona la oferta del viernes" className="input !pr-24 !text-[15px]" />
                <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
                  {speech.supported && (
                    <button type="button" onClick={() => (speech.listening ? speech.stop() : speech.start())} aria-label={speech.listening ? "Parar de grabar" : "Dictar el cambio"} aria-pressed={speech.listening} className={`grid h-9 w-9 place-items-center rounded-full ${speech.listening ? "bg-danger text-white" : "text-muted hover:bg-black/5"}`}>
                      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="9" y="2.5" width="6" height="11" rx="3" /><path d="M5 11.5a7 7 0 0 0 14 0M12 18.5V22" /></svg>
                    </button>
                  )}
                  <button type="submit" disabled={revising || instruction.trim().length < 3} aria-label="Aplicar cambio" className="grid h-9 w-9 place-items-center rounded-full bg-ink text-white disabled:opacity-30">↑</button>
                </div>
              </form>

              {history.length > 0 && (
                <ul className="mt-4 space-y-1.5 text-xs text-muted">
                  {history.map((h, i) => (
                    <li key={i} className="flex gap-2"><span className="text-ok">✓</span><span className="truncate">{h}</span></li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="card p-5 text-sm text-muted">
              <p className="font-semibold text-ink">Lo que le contaste a {p.writer.name}</p>
              <p className="mt-2 whitespace-pre-line">{p.brief}</p>
            </div>
          )}

          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>}

          {!readOnly && (
            <div className="mt-4 space-y-2.5">
              <button onClick={() => (p.confirmed > 0 ? setConfirm(true) : setError("Aún no tienes suscriptores confirmados. Añádelos en Audiencia."))} className="btn btn-primary w-full !py-3.5">
                Enviar a {p.confirmed} {p.confirmed === 1 ? "persona" : "personas"}
              </button>
              <button onClick={sendTest} disabled={testing} className="btn btn-soft w-full">{testing ? "Enviando prueba…" : "Enviarme una prueba"}</button>
              <p className="text-center text-xs text-muted" aria-live="polite">
                {save === "saving" ? "Guardando…" : save === "saved" ? "Guardado ✓" : save === "dirty" ? "Cambios sin guardar…" : save === "error" ? "No se pudo guardar" : "Se guarda solo"}
              </p>
            </div>
          )}
        </aside>
      </div>

      {toast && (
        <div role="status" className="anim-fade-up fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm text-white shadow-xl md:bottom-8">
          {toast}
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="ctitle">
          <div className="card anim-pop w-full max-w-sm p-7 text-center">
            <Animal id={p.writer.animal} size={72} className="mx-auto" />
            <h2 id="ctitle" className="mt-4 text-xl font-semibold">¿Enviamos la newsletter?</h2>
            <p className="mt-2 text-sm text-muted">
              Se enviará a <b className="text-ink">{p.confirmed} {p.confirmed === 1 ? "persona" : "personas"}</b> y no se puede deshacer.
            </p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setConfirm(false)} disabled={sending} className="btn btn-soft flex-1">Todavía no</button>
              <button onClick={sendAll} disabled={sending} className="btn btn-primary flex-1">{sending ? "Enviando…" : "Enviar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
