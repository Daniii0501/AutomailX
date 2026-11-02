"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import { fecha } from "@/lib/format-utils";

type Sub = { id: string; email: string; name: string; status: "pending" | "confirmed" | "unsubscribed"; source: string; created_at: string };

const STATUS: Record<Sub["status"], { t: string; c: string }> = {
  confirmed: { t: "Confirmado", c: "bg-[#e9f7f0] text-[#145c3f]" },
  pending: { t: "Pendiente", c: "bg-[#fff6e8] text-[#6b4a12]" },
  unsubscribed: { t: "De baja", c: "bg-[#f4f2ef] text-muted" },
};

export default function AudienceManager({ subs, publicUrl, limit, mailOn }: { subs: Sub[]; publicUrl: string; limit: number; mailOn: boolean }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [filter, setFilter] = useState<"all" | Sub["status"]>("all");
  const [copied, setCopied] = useState(false);

  const active = subs.filter((s) => s.status !== "unsubscribed").length;
  const shown = subs.filter((s) => filter === "all" || s.status === filter);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await api<{ added: number; skipped: number; confirmationsSent: number; error?: string }>("/api/subscribers", { body: { emails: text, consent } });
      const parts = [`${r.added} añadido${r.added === 1 ? "" : "s"}`];
      if (r.skipped) parts.push(`${r.skipped} ya estaba${r.skipped === 1 ? "" : "n"} o no cabía${r.skipped === 1 ? "" : "n"}`);
      if (!consent && r.added) parts.push(mailOn ? `les hemos pedido que confirmen por correo (${r.confirmationsSent})` : "quedan pendientes: sin Resend no podemos mandarles la confirmación");
      setMsg({ ok: true, text: parts.join(" · ") + "." });
      setText("");
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function act(id: string, action: "resend" | "unsubscribe" | "delete") {
    if (action === "delete" && !confirm("¿Borrar a esta persona de tu lista?")) return;
    try {
      if (action === "delete") await api(`/api/subscribers/${id}`, { method: "DELETE" });
      else await api(`/api/subscribers/${id}`, { method: "PATCH", body: { action } });
      setMsg({ ok: true, text: action === "resend" ? "Confirmación reenviada." : action === "unsubscribe" ? "Dado de baja." : "Borrado." });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    }
  }

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <p className="font-semibold">Tu página para que la gente se apunte</p>
        <p className="text-sm text-muted">Compártela en Instagram, WhatsApp o donde quieras.</p>
        <div className="mt-3 flex gap-2">
          <input readOnly value={publicUrl} className="input text-sm" aria-label="Enlace de suscripción" onFocus={(e) => e.currentTarget.select()} />
          <button
            type="button"
            className="btn btn-soft shrink-0"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(publicUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              } catch {
                /* sin portapapeles */
              }
            }}
          >
            {copied ? "¡Copiado!" : "Copiar"}
          </button>
        </div>
        <a href={publicUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold underline underline-offset-2">Ver la página</a>
      </div>

      <form onSubmit={add} className="card space-y-3 p-5">
        <label htmlFor="emails" className="font-semibold">Añadir personas</label>
        <p className="text-sm text-muted">Un correo o muchos: pega una lista (uno por línea o separados por comas).</p>
        <textarea id="emails" className="input" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={"ana@correo.com\nluis@correo.com"} />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 accent-[var(--brand)]" />
          <span>Estas personas ya me han dado permiso para escribirles. <span className="text-muted">Si no lo marcas, les mandamos un correo para que lo confirmen (lo más seguro).</span></span>
        </label>
        {msg && <p role="status" className={`banner ${msg.ok ? "banner-ok" : "banner-err"}`}>{msg.text}</p>}
        <button className="btn btn-primary" disabled={busy || text.trim().length < 5}>{busy ? "Añadiendo…" : "Añadir"}</button>
        <p className="hint">{active} de {limit} en el plan gratis.</p>
      </form>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Tu lista ({subs.length})</h2>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "confirmed", "pending", "unsubscribed"] as const).map((f) => (
              <button key={f} className="chip !px-3 !py-1 text-xs" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {f === "all" ? "Todos" : STATUS[f].t}
              </button>
            ))}
          </div>
        </div>
        {shown.length === 0 ? (
          <p className="card mt-3 p-6 text-center text-muted">{subs.length === 0 ? "Todavía no hay nadie. Añade tu propio correo para probar." : "Nadie con este estado."}</p>
        ) : (
          <ul className="card mt-3 divide-y divide-line">
            {shown.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{s.email}</p>
                  <p className="text-xs text-muted">{s.name ? `${s.name} · ` : ""}desde el {fecha(s.created_at)}{s.source === "form" ? " · por tu página" : ""}</p>
                </div>
                <span className={`pill ${STATUS[s.status].c}`}>{STATUS[s.status].t}</span>
                <div className="flex gap-3 text-xs font-semibold">
                  {s.status === "pending" && <button className="underline" onClick={() => act(s.id, "resend")}>Reenviar</button>}
                  {s.status === "confirmed" && <button className="underline" onClick={() => act(s.id, "unsubscribe")}>Dar de baja</button>}
                  <button className="text-danger underline" onClick={() => act(s.id, "delete")}>Borrar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
