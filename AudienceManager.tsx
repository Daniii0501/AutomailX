"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

type Sub = { id: string; email: string; name: string; status: string; source: string; created_at: number };

const LABEL: Record<string, { t: string; c: string }> = {
  confirmed: { t: "Confirmado", c: "bg-ok/10 text-ok" },
  pending: { t: "Pendiente", c: "bg-amber-100 text-amber-800" },
  unsubscribed: { t: "Baja", c: "bg-black/5 text-muted" },
};

export default function AudienceManager({ subs, shareUrl, limit }: { subs: Sub[]; shareUrl: string; limit: number }) {
  const router = useRouter();
  const [emails, setEmails] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [q, setQ] = useState("");

  const active = subs.filter((s) => s.status !== "unsubscribed").length;
  const shown = subs.filter((s) => s.email.includes(q.toLowerCase()) || s.name.toLowerCase().includes(q.toLowerCase()));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await api<{ added: number; skipped: number; invalid: number; overLimit: number }>("/api/subscribers", "POST", { emails, consent });
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: r.data.error ?? "No se pudo añadir." });
    const d = r.data;
    const parts = [`${d.added} añadidos`];
    if (d.skipped) parts.push(`${d.skipped} ya estaban`);
    if (d.invalid) parts.push(`${d.invalid} no válidos`);
    if (d.overLimit) parts.push(`${d.overLimit} fuera del límite de ${limit}`);
    setMsg({ ok: d.added > 0, text: parts.join(" · ") });
    if (d.added > 0) setEmails("");
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("¿Quitar a esta persona de tu lista?")) return;
    const r = await api(`/api/subscribers/${id}`, "DELETE");
    if (r.ok) router.refresh();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copia este enlace:", shareUrl);
    }
  }

  return (
    <div className="space-y-8">
      <div className="card p-6">
        <h2 className="text-lg font-semibold">Tu página de suscripción</h2>
        <p className="mt-1 text-sm text-muted">Compártela en tus redes o en tu web. Quien se apunte recibirá un correo para confirmar.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input readOnly value={shareUrl} aria-label="Enlace de suscripción" onFocus={(e) => e.currentTarget.select()} className="input !py-3 text-sm" />
          <button onClick={copy} className="btn btn-primary shrink-0">{copied ? "¡Copiado!" : "Copiar enlace"}</button>
        </div>
        <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-brand hover:underline">Ver cómo se ve →</a>
      </div>

      <form onSubmit={add} className="card p-6">
        <h2 className="text-lg font-semibold">Añadir suscriptores</h2>
        <p className="mt-1 text-sm text-muted">Pega uno o varios correos, separados por comas, espacios o saltos de línea.</p>
        <textarea value={emails} onChange={(e) => setEmails(e.target.value)} rows={4} aria-label="Correos" placeholder={"ana@correo.com\nluis@correo.com"} className="input mt-4 resize-none" />
        <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-muted">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" />
          <span>Confirmo que estas personas me han dado permiso para enviarles mi newsletter.</span>
        </label>
        {msg && <p role="status" className={`mt-4 rounded-xl px-3 py-2 text-sm ${msg.ok ? "bg-ok/10 text-ok" : "bg-red-50 text-danger"}`}>{msg.text}</p>}
        <button type="submit" disabled={busy || !consent || emails.trim().length < 5} className="btn btn-primary mt-4">{busy ? "Añadiendo…" : "Añadir"}</button>
      </form>

      <div>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">
            Tu gente <span className="font-normal text-muted">· {active} de {limit}</span>
          </h2>
          {subs.length > 6 && <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" aria-label="Buscar suscriptor" className="input !w-48 !py-2 text-sm" />}
        </div>
        {subs.length === 0 ? (
          <p className="card p-8 text-center text-muted">Todavía no hay nadie. Añade correos arriba o comparte tu enlace.</p>
        ) : (
          <ul className="card divide-y divide-line overflow-hidden">
            {shown.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px]">{s.email}</p>
                  {s.name && <p className="truncate text-xs text-muted">{s.name}</p>}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${LABEL[s.status]?.c ?? ""}`}>{LABEL[s.status]?.t ?? s.status}</span>
                <button onClick={() => remove(s.id)} aria-label={`Quitar a ${s.email}`} className="shrink-0 text-muted hover:text-danger">×</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
