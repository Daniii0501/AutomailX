"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { api } from "@/lib/client";
import { fecha, plural } from "@/lib/format-utils";
import type { Look, Newsletter } from "@/lib/newsletter";
import { renderNewsletter } from "@/lib/render";
import WriterAvatar from "./WriterAvatar";

type Props = {
  id: string;
  initial: Newsletter;
  status: "draft" | "sending" | "sent";
  warnings: string[];
  look: Look;
  confirmed: number;
  publicationName: string;
  senderName: string;
  replyTo: string | null;
  siteUrl: string;
  mailOn: boolean;
  sentAt: string | null;
  recipients: number;
  delivery: string | null;
  formatLabel: string;
  /** Resultados de la campaña (solo si ya se envió). */
  results?: React.ReactNode;
};

const QUICK = ["Más corto", "Más gracioso", "Más cercano", "Más formal", "Mejora el asunto", "Más emoción"];

export default function Editor(p: Props) {
  const router = useRouter();
  const [n, setN] = useState<Newsletter>(p.initial);
  const [saved, setSaved] = useState<Newsletter>(p.initial);
  const [tab, setTab] = useState<"preview" | "edit">("preview");
  const [busy, setBusy] = useState<"" | "save" | "revise" | "test" | "send" | "delete">("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | "info"; text: string } | null>(null);
  const [instruction, setInstruction] = useState("");
  const [confirmSend, setConfirmSend] = useState(false);
  const readOnly = p.status !== "draft";
  const dirty = JSON.stringify(n) !== JSON.stringify(saved);

  const html = useMemo(
    () => renderNewsletter(n, { look: p.look, senderName: p.senderName, publicationName: p.publicationName, replyTo: p.replyTo ?? undefined, siteUrl: p.siteUrl, unsubscribeUrl: `${p.siteUrl}/u/vista-previa` }).html,
    [n, p.look, p.senderName, p.publicationName, p.replyTo, p.siteUrl],
  );

  const setField = <K extends keyof Newsletter>(k: K, v: Newsletter[K]) => setN((x) => ({ ...x, [k]: v }));
  const setSection = (i: number, k: "title" | "body", v: string) => setN((x) => ({ ...x, sections: x.sections.map((s, j) => (j === i ? { ...s, [k]: v } : s)) }));

  async function save(quiet = false): Promise<boolean> {
    if (!dirty) return true;
    setBusy("save");
    try {
      const r = await api<{ content: Newsletter }>(`/api/newsletters/${p.id}`, { method: "PATCH", body: { content: n } });
      setSaved(r.content);
      if (!quiet) setMsg({ kind: "ok", text: "Cambios guardados." });
      return true;
    } catch (e) {
      setMsg({ kind: "err", text: (e as Error).message });
      return false;
    } finally {
      setBusy("");
    }
  }

  async function revise(text: string) {
    const ins = text.trim();
    if (ins.length < 3) return;
    setBusy("revise");
    setMsg({ kind: "info", text: `${p.look.name} está reescribiendo…` });
    try {
      const r = await api<{ content: Newsletter; simulated: boolean }>(`/api/newsletters/${p.id}/revise`, { body: { instruction: ins, content: n } });
      setN(r.content);
      setSaved(r.content);
      setInstruction("");
      setTab("preview");
      setMsg({ kind: "ok", text: r.simulated ? "Hecho (en modo simulado solo entiendo cambios sencillos)." : "Hecho. Échale un vistazo." });
    } catch (e) {
      setMsg({ kind: "err", text: (e as Error).message });
    } finally {
      setBusy("");
    }
  }

  async function test() {
    if (!(await save(true))) return;
    setBusy("test");
    try {
      const r = await api<{ demo: boolean }>(`/api/newsletters/${p.id}/send`, { body: { test: true } });
      setMsg(r.demo ? { kind: "info", text: "Modo prueba: no ha salido ningún correo porque falta conectar Resend." } : { kind: "ok", text: "Prueba enviada a tu correo. Mira la bandeja de entrada." });
    } catch (e) {
      setMsg({ kind: "err", text: (e as Error).message });
    } finally {
      setBusy("");
    }
  }

  async function send() {
    if (!(await save(true))) return;
    setBusy("send");
    try {
      const r = await api<{ demo: boolean; sent: number; partial?: string }>(`/api/newsletters/${p.id}/send`, { body: {} });
      setConfirmSend(false);
      setMsg({
        kind: r.partial ? "err" : "ok",
        text: r.demo
          ? `Marcada como enviada a ${plural(r.sent, "persona", "personas")} (modo prueba: no ha salido ningún correo real).`
          : `¡Enviada a ${plural(r.sent, "persona", "personas")}!${r.partial ? ` Pero hubo un problema con algunos: ${r.partial}` : ""}`,
      });
      router.refresh();
    } catch (e) {
      setConfirmSend(false);
      setMsg({ kind: "err", text: (e as Error).message });
    } finally {
      setBusy("");
    }
  }

  async function del() {
    if (!confirm("¿Borrar este borrador? No se puede deshacer.")) return;
    setBusy("delete");
    try {
      await api(`/api/newsletters/${p.id}`, { method: "DELETE" });
      router.push("/panel/historial");
    } catch (e) {
      setMsg({ kind: "err", text: (e as Error).message });
      setBusy("");
    }
  }

  const banner = (k: string) => (k === "ok" ? "banner-ok" : k === "err" ? "banner-err" : "banner-info");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <WriterAvatar look={p.look} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted">
            Escrita por {p.look.name} · {p.formatLabel}
          </p>
          <h1 className="truncate text-xl font-bold sm:text-2xl">{n.subject}</h1>
        </div>
      </div>

      {readOnly && (
        <p className="banner banner-ok">
          {p.status === "sending" ? "Enviándose ahora mismo…" : `Enviada el ${fecha(p.sentAt, true)} a ${plural(p.recipients, "persona", "personas")}${p.delivery === "demo" ? " (modo prueba, sin correo real)" : ""}.`}
        </p>
      )}
      {p.results}
      {!readOnly && p.warnings.map((w) => <p key={w} className="banner banner-warn">⚠️ {w}</p>)}
      {msg && <p role="status" className={`banner ${banner(msg.kind)}`}>{msg.text}</p>}

      {!readOnly && (
        <div role="tablist" className="inline-flex rounded-full border border-line bg-white p-1">
          <button role="tab" aria-selected={tab === "preview"} onClick={() => setTab("preview")} className="tab rounded-full px-4 py-1.5 text-sm font-semibold">Vista previa</button>
          <button role="tab" aria-selected={tab === "edit"} onClick={() => setTab("edit")} className="tab rounded-full px-4 py-1.5 text-sm font-semibold">Editar texto</button>
        </div>
      )}

      {tab === "preview" || readOnly ? (
        <div className="card overflow-hidden">
          <div className="border-b border-line px-4 py-3 text-sm">
            <p><span className="text-muted">De:</span> <strong>{p.senderName}</strong></p>
            <p className="truncate"><span className="text-muted">Asunto:</span> {n.subject}</p>
            {n.preheader && <p className="truncate text-muted">{n.preheader}</p>}
          </div>
          <iframe title="Vista previa del correo" srcDoc={html} sandbox="" className="block h-[70vh] w-full bg-[#f4f2ef]" />
        </div>
      ) : (
        <div className="card space-y-4 p-5">
          <Text id="subject" label="Asunto" value={n.subject} max={120} onChange={(v) => setField("subject", v)} hint={`${n.subject.length} caracteres (ideal: 25–55)`} />
          <Text id="preheader" label="Texto de vista previa" value={n.preheader} max={160} onChange={(v) => setField("preheader", v)} hint="Lo que se ve junto al asunto en la bandeja de entrada." />
          <Text id="greeting" label="Saludo" value={n.greeting} max={200} onChange={(v) => setField("greeting", v)} />
          {n.sections.map((s, i) => (
            <div key={i} className="rounded-2xl border border-line p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest text-muted uppercase">Bloque {i + 1}</span>
                {n.sections.length > 1 && (
                  <button type="button" className="text-xs font-semibold text-danger" onClick={() => setN((x) => ({ ...x, sections: x.sections.filter((_, j) => j !== i) }))}>Quitar</button>
                )}
              </div>
              <Text id={`st${i}`} label="Título (opcional)" value={s.title} max={80} onChange={(v) => setSection(i, "title", v)} />
              <div className="mt-3">
                <label htmlFor={`sb${i}`} className="label">Texto</label>
                <textarea id={`sb${i}`} className="input font-serif" rows={Math.min(14, Math.max(4, Math.ceil(s.body.length / 70)))} maxLength={4000} value={s.body} onChange={(e) => setSection(i, "body", e.target.value)} />
              </div>
            </div>
          ))}
          {n.sections.length < 8 && (
            <button type="button" className="btn btn-soft" onClick={() => setN((x) => ({ ...x, sections: [...x.sections, { title: "", body: "Escribe aquí…" }] }))}>+ Añadir bloque</button>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Text id="cta" label="Botón (llamada a la acción)" value={n.cta} max={80} onChange={(v) => setField("cta", v)} />
            <Text id="ctaUrl" label="Enlace del botón" value={n.ctaUrl ?? ""} max={500} onChange={(v) => setField("ctaUrl", v || undefined)} hint="Si lo dejas vacío, el botón abre una respuesta a tu correo." />
          </div>
          <Text id="signoff" label="Despedida" value={n.signoff} max={80} onChange={(v) => setField("signoff", v)} />
          <button type="button" className="btn btn-primary" disabled={!dirty || !!busy} onClick={() => save()}>{busy === "save" ? "Guardando…" : dirty ? "Guardar cambios" : "Guardado"}</button>
        </div>
      )}

      {!readOnly && (
        <>
          <div className="card p-5">
            <p className="font-semibold">Pídele un cambio a {p.look.name}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button key={q} type="button" className="chip" disabled={!!busy} onClick={() => revise(q)}>{q}</button>
              ))}
            </div>
            <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); revise(instruction); }}>
              <label htmlFor="ins" className="sr-only">Qué cambiar</label>
              <input id="ins" className="input" placeholder="Ej.: menciona que el sábado cerramos" value={instruction} maxLength={500} onChange={(e) => setInstruction(e.target.value)} />
              <button className="btn btn-soft shrink-0" disabled={!!busy || instruction.trim().length < 3}>{busy === "revise" ? "…" : "Pedir"}</button>
            </form>
          </div>

          <div className="card space-y-3 p-5">
            <div className="flex flex-wrap gap-3">
              <button className="btn btn-soft" onClick={test} disabled={!!busy}>{busy === "test" ? "Enviando…" : "Enviarme una prueba"}</button>
              <button className="btn btn-primary" onClick={() => setConfirmSend(true)} disabled={!!busy || p.confirmed === 0}>Enviar a mi lista</button>
              <button className="btn btn-danger ml-auto" onClick={del} disabled={!!busy}>Borrar</button>
            </div>
            {p.confirmed === 0 ? (
              <p className="hint">Aún no tienes suscriptores confirmados. <a href="/panel/audiencia" className="underline">Añade alguno en Audiencia</a>.</p>
            ) : (
              <p className="hint">Se enviará a {plural(p.confirmed, "persona confirmada", "personas confirmadas")}.{!p.mailOn && " (Modo prueba: falta conectar Resend.)"}</p>
            )}
          </div>
        </>
      )}

      {confirmSend && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="cs-title">
          <div className="card anim-pop w-full max-w-sm p-6">
            <h2 id="cs-title" className="text-xl font-bold">¿Enviar ahora?</h2>
            <p className="mt-2 text-muted">
              «{n.subject}» llegará a <strong className="text-ink">{plural(p.confirmed, "persona", "personas")}</strong>. Esto no se puede deshacer.
            </p>
            <div className="mt-5 flex gap-3">
              <button className="btn btn-primary flex-1" onClick={send} disabled={busy === "send"} autoFocus>{busy === "send" ? "Enviando…" : "Sí, enviar"}</button>
              <button className="btn btn-soft" onClick={() => setConfirmSend(false)} disabled={busy === "send"}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Text({ id, label, value, onChange, max, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; max: number; hint?: string }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} className="input" value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} />
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}
