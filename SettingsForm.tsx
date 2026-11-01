"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

type Pub = { name: string; sender_name: string; slug: string; reply_to: string; cadence_day: number | null };

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function SettingsForm({ initial, email, baseUrl }: { initial: Pub; email: string; baseUrl: string }) {
  const router = useRouter();
  const [v, setV] = useState<Pub>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [del, setDel] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");

  const set = <K extends keyof Pub>(k: K, val: Pub[K]) => setV((p) => ({ ...p, [k]: val }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await api("/api/settings", "PATCH", v);
    setBusy(false);
    setMsg(r.ok ? { ok: true, text: "Guardado ✓" } : { ok: false, text: r.data.error ?? "No se pudo guardar." });
    if (r.ok) router.refresh();
  }

  async function removeAccount() {
    setBusy(true);
    const r = await api("/api/account", "DELETE", { confirm: confirmEmail });
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: r.data.error ?? "No se pudo borrar." });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={save} className="card space-y-5 p-6">
        <h2 className="text-lg font-semibold">Tu newsletter</h2>
        <div>
          <label htmlFor="s-name" className="mb-2 block text-sm font-medium">Nombre de la newsletter</label>
          <input id="s-name" value={v.name} onChange={(e) => set("name", e.target.value)} maxLength={60} className="input" />
        </div>
        <div>
          <label htmlFor="s-sender" className="mb-2 block text-sm font-medium">Quién la firma <span className="font-normal text-muted">(aparece como remitente)</span></label>
          <input id="s-sender" value={v.sender_name} onChange={(e) => set("sender_name", e.target.value)} maxLength={60} className="input" />
        </div>
        <div>
          <label htmlFor="s-reply" className="mb-2 block text-sm font-medium">Correo de respuesta <span className="font-normal text-muted">(donde te escriben)</span></label>
          <input id="s-reply" type="email" value={v.reply_to} onChange={(e) => set("reply_to", e.target.value)} placeholder={email} className="input" />
        </div>
        <div>
          <label htmlFor="s-slug" className="mb-2 block text-sm font-medium">Enlace de suscripción</label>
          <div className="flex items-center rounded-2xl border border-line bg-white pl-4 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
            <span className="shrink-0 text-sm text-muted">{baseUrl.replace(/^https?:\/\//, "")}/s/</span>
            <input id="s-slug" value={v.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} maxLength={40} className="w-full bg-transparent py-3 pr-4 outline-none" />
          </div>
        </div>
        <div>
          <label htmlFor="s-day" className="mb-2 block text-sm font-medium">Recordatorio semanal</label>
          <select id="s-day" value={v.cadence_day ?? ""} onChange={(e) => set("cadence_day", e.target.value === "" ? null : Number(e.target.value))} className="input">
            <option value="">Sin recordatorio</option>
            {DAYS.map((d, i) => (<option key={d} value={i}>Cada {d.toLowerCase()}</option>))}
          </select>
          <p className="mt-1.5 text-xs text-muted">Ese día tu redactor te escribe para que le cuentes la semana.</p>
        </div>
        {msg && <p role="status" className={`rounded-xl px-3 py-2 text-sm ${msg.ok ? "bg-ok/10 text-ok" : "bg-red-50 text-danger"}`}>{msg.text}</p>}
        <button type="submit" disabled={busy} className="btn btn-primary">{busy ? "Guardando…" : "Guardar"}</button>
      </form>

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Tu plan</h2>
        <p className="mt-1 text-sm text-muted">Estás en el plan <b className="text-ink">Gratis</b>. El plan Pro llegará pronto.</p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Tu cuenta</h2>
        <p className="mt-1 text-sm text-muted">{email}</p>
        {!del ? (
          <button onClick={() => setDel(true)} className="mt-4 text-sm text-danger hover:underline">Borrar mi cuenta y todos mis datos</button>
        ) : (
          <div className="mt-4 space-y-3 rounded-2xl border border-red-200 bg-red-50/50 p-4">
            <p className="text-sm">Se borrarán tu cuenta, tus redactores, newsletters y suscriptores. No se puede deshacer. Escribe tu correo para confirmar:</p>
            <input value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} aria-label="Confirma tu correo" placeholder={email} className="input" />
            <div className="flex gap-2">
              <button onClick={() => { setDel(false); setConfirmEmail(""); }} className="btn btn-soft">Cancelar</button>
              <button onClick={removeAccount} disabled={busy || confirmEmail.trim().toLowerCase() !== email} className="btn btn-danger">Borrar todo</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
