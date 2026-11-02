"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import { FORMATS, FORMAT_IDS, type FormatId } from "@/lib/formats";
import type { Look } from "@/lib/newsletter";
import WriterAvatar from "./WriterAvatar";

export type TopicLite = {
  id: string;
  title: string;
  notes: string;
  writer_id: string | null;
  format: FormatId;
  scheduled_day: string | null;
  send_hour: number;
  mode: "draft" | "send";
  status: "idea" | "scheduled" | "running" | "drafted" | "sent" | "failed";
  newsletter_id: string | null;
  error: string | null;
};
type W = { id: string; name: string; look: Look };

const EMPTY = { title: "", notes: "", writerId: "", format: "auto" as FormatId, day: "", hour: 8, mode: "draft" as "draft" | "send" };

function dayLabel(d: string) {
  return new Date(`${d}T12:00:00`).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

export default function TopicsManager({ topics, writers, today, mailOn }: { topics: TopicLite[]; writers: W[]; today: string; mailOn: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...EMPTY, writerId: writers[0]?.id ?? "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(topics.length === 0);
  const [busy, setBusy] = useState<string>("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const wById = new Map(writers.map((w) => [w.id, w]));

  const scheduled = topics.filter((t) => t.status === "scheduled" || t.status === "running" || (t.status === "failed" && t.scheduled_day));
  const ideas = topics.filter((t) => t.status === "idea" || (t.status === "failed" && !t.scheduled_day));
  const done = topics.filter((t) => t.status === "drafted" || t.status === "sent");

  function startEdit(t: TopicLite) {
    setEditing(t.id);
    setForm({ title: t.title, notes: t.notes, writerId: t.writer_id ?? writers[0]?.id ?? "", format: t.format, day: t.scheduled_day ?? "", hour: t.send_hour, mode: t.mode });
    setOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy("form");
    setMsg(null);
    try {
      if (editing) await api(`/api/topics/${editing}`, { method: "PATCH", body: form });
      else await api("/api/topics", { body: form });
      setMsg({ ok: true, text: form.day ? `Programado para el ${dayLabel(form.day)} a las ${form.hour}:00.` : "Guardado en tu banco de ideas." });
      setForm({ ...EMPTY, writerId: form.writerId });
      setEditing(null);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy("");
    }
  }

  async function writeNow(t: TopicLite) {
    setBusy(t.id);
    setMsg({ ok: true, text: `Escribiendo «${t.title}»… (20–60 segundos)` });
    try {
      const r = await api<{ newsletterId: string }>(`/api/topics/${t.id}/write-now`, { body: {} });
      router.push(`/panel/n/${r.newsletterId}`);
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
      setBusy("");
      router.refresh();
    }
  }

  async function del(t: TopicLite) {
    if (!confirm(`¿Borrar el tema «${t.title}»?`)) return;
    try {
      await api(`/api/topics/${t.id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    }
  }

  const Card = ({ t }: { t: TopicLite }) => {
    const w = t.writer_id ? wById.get(t.writer_id) : undefined;
    const editable = t.status === "idea" || t.status === "scheduled" || t.status === "failed";
    return (
      <li className="card p-4">
        <div className="flex items-start gap-3">
          {w ? <WriterAvatar look={w.look} size={36} /> : <span className="h-9 w-9 rounded-full bg-[#f4f2ef]" />}
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t.title}</p>
            <p className="text-xs text-muted">
              {FORMATS[t.format]?.emoji} {t.format === "auto" ? "Estilo libre" : FORMATS[t.format]?.label}
              {t.scheduled_day && ` · ${dayLabel(t.scheduled_day)}, ${t.send_hour}:00`}
              {t.scheduled_day && (t.mode === "send" ? " · se envía solo" : " · borrador para revisar")}
            </p>
            {t.notes && <p className="mt-1 line-clamp-2 text-sm text-muted">{t.notes}</p>}
            {t.status === "running" && <p className="mt-2 text-sm font-semibold text-brand">Escribiéndose…</p>}
            {t.error && <p className="mt-2 text-sm text-danger">{t.error}</p>}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
          {editable && (
            <button className="btn btn-primary !px-4 !py-2 text-sm" onClick={() => writeNow(t)} disabled={!!busy}>
              {busy === t.id ? "Escribiendo…" : "Escribir ahora"}
            </button>
          )}
          {t.newsletter_id && <Link href={`/panel/n/${t.newsletter_id}`} className="btn btn-soft !px-4 !py-2 text-sm">{t.status === "sent" ? "Ver enviada" : "Revisar borrador"}</Link>}
          {editable && <button className="underline" onClick={() => startEdit(t)} disabled={!!busy}>Editar</button>}
          <button className="text-danger underline" onClick={() => del(t)} disabled={!!busy}>Borrar</button>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      {msg && <p role="status" className={`banner ${msg.ok ? "banner-info" : "banner-err"}`}>{msg.text}</p>}

      {!open ? (
        <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Nuevo tema</button>
      ) : (
        <form onSubmit={submit} className="card space-y-4 p-5">
          <h2 className="font-bold">{editing ? "Editar tema" : "Nuevo tema"}</h2>
          <div>
            <label htmlFor="ttitle" className="label">¿De qué va?</label>
            <input id="ttitle" className="input" required minLength={3} maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej.: Llega la carta de invierno" />
          </div>
          <div>
            <label htmlFor="tnotes" className="label">Lo que debe contar</label>
            <textarea id="tnotes" className="input" rows={4} maxLength={2000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Datos, fechas, precios, detalles… Solo usará lo que pongas aquí." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="twriter" className="label">Redactor</label>
              <select id="twriter" className="input" value={form.writerId} onChange={(e) => setForm({ ...form, writerId: e.target.value })}>
                {writers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="tformat" className="label">Estilo</label>
              <select id="tformat" className="input" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value as FormatId })}>
                {FORMAT_IDS.map((id) => <option key={id} value={id}>{FORMATS[id].emoji} {id === "auto" ? "El habitual del redactor" : FORMATS[id].label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tday" className="label">Día <span className="font-normal text-muted">(opcional)</span></label>
              <input id="tday" type="date" min={today} className="input" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} />
              <p className="hint">Sin día, se queda en tu banco de ideas.</p>
            </div>
            <div>
              <label htmlFor="thour" className="label">Hora (España)</label>
              <select id="thour" className="input" value={form.hour} disabled={!form.day} onChange={(e) => setForm({ ...form, hour: Number(e.target.value) })}>
                {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}
              </select>
            </div>
          </div>
          {form.day && (
            <fieldset>
              <legend className="label">Cuando llegue el día…</legend>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="chip" aria-pressed={form.mode === "draft"} onClick={() => setForm({ ...form, mode: "draft" })}>Escríbelo y avísame para revisarlo</button>
                <button type="button" className="chip" aria-pressed={form.mode === "send"} onClick={() => setForm({ ...form, mode: "send" })}>Escríbelo y envíalo solo</button>
              </div>
              {form.mode === "send" && <p className="hint text-[#6b4a12]">Se enviará sin que lo revises. Recomendado solo si ya confías en tu redactor.</p>}
              {!mailOn && <p className="hint">Ojo: sin Resend conectado, no podremos avisarte por correo.</p>}
            </fieldset>
          )}
          <div className="flex gap-3">
            <button className="btn btn-primary" disabled={busy === "form" || !writers.length}>{busy === "form" ? "Guardando…" : editing ? "Guardar" : form.day ? "Programar" : "Guardar idea"}</button>
            <button type="button" className="btn btn-soft" onClick={() => { setOpen(false); setEditing(null); setForm({ ...EMPTY, writerId: writers[0]?.id ?? "" }); }}>Cancelar</button>
          </div>
        </form>
      )}

      {[
        { title: "Programados", list: scheduled, empty: "Nada programado." },
        { title: "Banco de ideas", list: ideas, empty: "Apunta aquí ideas para cuando no sepas de qué escribir." },
        { title: "Ya escritos", list: done, empty: "" },
      ].map((g) =>
        g.list.length || g.empty ? (
          <section key={g.title}>
            <h2 className="mb-2 font-bold">{g.title} {g.list.length > 0 && <span className="text-muted">({g.list.length})</span>}</h2>
            {g.list.length ? <ul className="space-y-2">{g.list.map((t) => <Card key={t.id} t={t} />)}</ul> : <p className="text-sm text-muted">{g.empty}</p>}
          </section>
        ) : null,
      )}
    </div>
  );
}
