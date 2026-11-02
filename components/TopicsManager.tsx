"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import WriterAvatar from "@/components/WriterAvatar";
import type { AnimalId } from "@/lib/animals";
import { api } from "@/lib/client";
import { FORMAT_IDS, FORMATS, type FormatId } from "@/lib/formats";

export type TopicView = {
  id: string;
  writer_id: string;
  title: string;
  notes: string;
  format: FormatId;
  scheduled_day: string | null;
  send_hour: number;
  mode: "draft" | "send";
  status: "idea" | "scheduled" | "running" | "drafted" | "sent" | "failed";
  newsletter_id: string | null;
  error: string | null;
};

export type TopicWriter = { id: string; name: string; kind: "animal" | "custom"; animal: AnimalId; avatar: string; color: string; format: FormatId };

type Form = { id: string | null; title: string; notes: string; writerId: string; format: FormatId; day: string; hour: number; mode: "draft" | "send" };

const dayLabel = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });

export default function TopicsManager({ topics, writers, today, confirmed }: { topics: TopicView[]; writers: TopicWriter[]; today: string; confirmed: number }) {
  const router = useRouter();
  const blank = (): Form => ({ id: null, title: "", notes: "", writerId: writers[0].id, format: writers[0].format, day: "", hour: 8, mode: "draft" });
  const [f, setF] = useState<Form>(blank);
  const [busy, setBusy] = useState(false);
  const [working, setWorking] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [open, setOpen] = useState(false);

  const byId = new Map(writers.map((w) => [w.id, w]));
  const scheduled = topics.filter((t) => t.status === "scheduled" || t.status === "running" || (t.status === "failed" && t.scheduled_day));
  const ideas = topics.filter((t) => t.status === "idea" || (t.status === "failed" && !t.scheduled_day));
  const done = topics.filter((t) => t.status === "drafted" || t.status === "sent");

  function pickWriter(id: string) {
    const w = byId.get(id);
    setF((p) => ({ ...p, writerId: id, format: w ? w.format : p.format }));
  }

  function edit(t: TopicView) {
    setF({ id: t.id, title: t.title, notes: t.notes, writerId: t.writer_id, format: t.format, day: t.scheduled_day ?? "", hour: t.send_hour, mode: t.mode });
    setOpen(true);
    setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const payload = { title: f.title, notes: f.notes, writerId: f.writerId, format: f.format, day: f.day || null, hour: f.hour, mode: f.mode };
    const r = f.id ? await api(`/api/topics/${f.id}`, "PATCH", payload) : await api("/api/topics", "POST", payload);
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: r.data.error ?? "No se pudo guardar." });
    setF(blank());
    setOpen(false);
    router.refresh();
  }

  async function remove(t: TopicView) {
    if (!confirm(`¿Quitar el tema «${t.title}»?`)) return;
    const r = await api(`/api/topics/${t.id}`, "DELETE");
    if (r.ok) router.refresh();
    else setMsg({ ok: false, text: r.data.error ?? "No se pudo quitar." });
  }

  async function writeNow(t: TopicView) {
    setWorking(t.id);
    setMsg(null);
    const r = await api<{ newsletterId?: string }>(`/api/topics/${t.id}/write-now`, "POST");
    setWorking(null);
    if (!r.ok || !r.data.newsletterId) return setMsg({ ok: false, text: r.data.error ?? "No se pudo escribir." });
    router.push(`/panel/n/${r.data.newsletterId}`);
  }

  function Card({ t }: { t: TopicView }) {
    const w = byId.get(t.writer_id);
    const isWorking = working === t.id || t.status === "running";
    return (
      <li className="card p-4">
        <div className="flex items-start gap-3">
          {w ? <WriterAvatar w={w} size={42} className="shrink-0" /> : <div className="h-[42px] w-[42px] shrink-0 rounded-full bg-line" />}
          <div className="min-w-0 flex-1">
            <p className="font-medium leading-snug">{t.title}</p>
            <p className="mt-0.5 text-sm text-muted">
              {w ? w.name : "Redactor eliminado"} · {FORMATS[t.format].emoji} {FORMATS[t.format].label}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
              {t.scheduled_day && (
                <span className="rounded-full bg-brand/10 px-2.5 py-1 font-medium text-brand">
                  {t.scheduled_day === today ? "Hoy" : dayLabel(t.scheduled_day)} · {String(t.send_hour).padStart(2, "0")}:00
                </span>
              )}
              {t.status !== "idea" && t.scheduled_day && (
                <span className={`rounded-full px-2.5 py-1 font-medium ${t.mode === "send" ? "bg-amber-100 text-amber-800" : "bg-black/5 text-muted"}`}>
                  {t.mode === "send" ? "Se enviará sola" : "Borrador para revisar"}
                </span>
              )}
              {t.status === "failed" && <span className="rounded-full bg-red-50 px-2.5 py-1 font-medium text-danger">Falló</span>}
            </div>
            {t.error && <p className="mt-2 text-xs text-danger">{t.error}</p>}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
          {(t.status === "drafted" || t.status === "sent") && t.newsletter_id ? (
            <Link href={`/panel/n/${t.newsletter_id}`} className="btn btn-soft !px-4 !py-2 !text-sm">
              {t.status === "sent" ? "Ver enviada" : "Abrir borrador"}
            </Link>
          ) : (
            <>
              <button onClick={() => writeNow(t)} disabled={isWorking} className="btn btn-primary !px-4 !py-2 !text-sm">
                {isWorking ? "Escribiendo…" : "Escribir ahora"}
              </button>
              <button onClick={() => edit(t)} disabled={isWorking} className="btn btn-soft !px-4 !py-2 !text-sm">Editar</button>
            </>
          )}
          <button onClick={() => remove(t)} disabled={isWorking} className="ml-auto text-sm text-muted hover:text-danger">Quitar</button>
        </div>
      </li>
    );
  }

  return (
    <div className="space-y-8">
      {!open ? (
        <button onClick={() => { setF(blank()); setOpen(true); }} className="card flex w-full items-center justify-between gap-4 p-5 text-left transition hover:shadow-lg">
          <span>
            <span className="block font-semibold">+ Añadir un tema</span>
            <span className="text-sm text-muted">Apunta una idea y, si quieres, elige qué día se escribe sola.</span>
          </span>
          <span className="btn btn-primary shrink-0">Nuevo</span>
        </button>
      ) : (
        <form onSubmit={save} className="card space-y-5 p-6">
          <h2 className="text-lg font-semibold">{f.id ? "Editar tema" : "Nuevo tema"}</h2>

          <div>
            <label htmlFor="t-title" className="mb-2 block text-sm font-medium">¿De qué va?</label>
            <input id="t-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={120} className="input" placeholder="Ej.: Lanzamiento del curso de fotografía" autoFocus />
          </div>

          <div>
            <label htmlFor="t-notes" className="mb-2 block text-sm font-medium">Lo que tiene que contar <span className="font-normal text-muted">(cuanto más detalle, mejor escribe)</span></label>
            <textarea id="t-notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={5} maxLength={2000} className="input resize-none" placeholder="Fechas, datos, anécdotas, a quién agradecer, qué quieres que haga el lector… Solo usará lo que escribas aquí." />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="t-writer" className="mb-2 block text-sm font-medium">Redactor</label>
              <select id="t-writer" value={f.writerId} onChange={(e) => pickWriter(e.target.value)} className="input">
                {writers.map((w) => (<option key={w.id} value={w.id}>{w.name}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="t-format" className="mb-2 block text-sm font-medium">Estilo</label>
              <select id="t-format" value={f.format} onChange={(e) => setF({ ...f, format: e.target.value as FormatId })} className="input">
                {FORMAT_IDS.map((id) => (<option key={id} value={id}>{FORMATS[id].emoji} {FORMATS[id].label}</option>))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="t-day" className="mb-2 block text-sm font-medium">Día <span className="font-normal text-muted">(opcional)</span></label>
              <input id="t-day" type="date" min={today} value={f.day} onChange={(e) => setF({ ...f, day: e.target.value })} className="input" />
            </div>
            {f.day && (
              <div>
                <label htmlFor="t-hour" className="mb-2 block text-sm font-medium">Hora (España)</label>
                <select id="t-hour" value={f.hour} onChange={(e) => setF({ ...f, hour: Number(e.target.value) })} className="input">
                  {Array.from({ length: 24 }, (_, h) => (<option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>))}
                </select>
              </div>
            )}
          </div>
          <p className="-mt-2 text-xs text-muted">Ese día y a esa hora tu redactor lo escribe (y lo envía, si lo eliges) y te avisa por correo. Sin día, queda en el banco de ideas.</p>

          {f.day && (
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Cuando llegue el día…</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={`cursor-pointer rounded-2xl border p-4 text-sm transition ${f.mode === "draft" ? "border-ink bg-white shadow-sm" : "border-line bg-white/60"}`}>
                  <input type="radio" name="mode" className="sr-only" checked={f.mode === "draft"} onChange={() => setF({ ...f, mode: "draft" })} />
                  <b className="block">Dejar el borrador listo</b>
                  <span className="text-muted">Te aviso y tú lo revisas antes de enviar. Lo más seguro.</span>
                </label>
                <label className={`cursor-pointer rounded-2xl border p-4 text-sm transition ${f.mode === "send" ? "border-ink bg-white shadow-sm" : "border-line bg-white/60"}`}>
                  <input type="radio" name="mode" className="sr-only" checked={f.mode === "send"} onChange={() => setF({ ...f, mode: "send" })} />
                  <b className="block">Enviar automáticamente</b>
                  <span className="text-muted">Se escribe y se envía sola a {confirmed} {confirmed === 1 ? "persona" : "personas"}, sin que la leas.</span>
                </label>
              </div>
              {f.mode === "send" && (
                <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  La IA puede equivocarse. Usa el envío automático solo cuando ya confíes en tu redactor y en las notas que le das.
                </p>
              )}
            </fieldset>
          )}

          {msg && <p role="alert" className={`rounded-xl px-3 py-2 text-sm ${msg.ok ? "bg-ok/10 text-ok" : "bg-red-50 text-danger"}`}>{msg.text}</p>}

          <div className="flex gap-2">
            <button type="button" onClick={() => { setOpen(false); setF(blank()); setMsg(null); }} className="btn btn-soft">Cancelar</button>
            <button type="submit" disabled={busy || f.title.trim().length < 3} className="btn btn-primary">
              {busy ? "Guardando…" : f.day ? "Programar" : "Guardar en el banco"}
            </button>
          </div>
        </form>
      )}

      {msg && !open && <p role="alert" className={`rounded-xl px-3 py-2 text-sm ${msg.ok ? "bg-ok/10 text-ok" : "bg-red-50 text-danger"}`}>{msg.text}</p>}

      <section>
        <h2 className="mb-3 text-xl font-semibold">Programados</h2>
        {scheduled.length === 0 ? (
          <p className="card p-6 text-center text-muted">Nada programado. Añade un tema con un día y se escribirá solo.</p>
        ) : (
          <ul className="space-y-3">{scheduled.map((t) => (<Card key={t.id} t={t} />))}</ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Banco de ideas</h2>
        {ideas.length === 0 ? (
          <p className="card p-6 text-center text-muted">Aquí van las ideas que aún no tienen fecha. Apúntalas cuando se te ocurran.</p>
        ) : (
          <ul className="space-y-3">{ideas.map((t) => (<Card key={t.id} t={t} />))}</ul>
        )}
      </section>

      {done.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-semibold">Ya escritos</h2>
          <ul className="space-y-3">{done.map((t) => (<Card key={t.id} t={t} />))}</ul>
        </section>
      )}
    </div>
  );
}
