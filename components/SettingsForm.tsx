"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

type Init = { name: string; senderName: string; replyTo: string; cadenceDay: number | null };

export default function SettingsForm({ initial, email }: { initial: Init; email: string }) {
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api("/api/settings", { method: "PATCH", body: { ...s, cadenceDay: s.cadenceDay ?? "" } });
      setMsg({ ok: true, text: "Guardado." });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount() {
    const typed = prompt(`Esto borra tu cuenta, tus redactores, tu lista y todas tus newsletters. No se puede deshacer.\n\nEscribe BORRAR para confirmar.`);
    if (typed?.trim().toUpperCase() !== "BORRAR") return;
    try {
      await api("/api/account", { method: "DELETE" });
      window.location.href = "/";
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="card space-y-4 p-5">
        <div>
          <label htmlFor="pname" className="label">Nombre de tu newsletter</label>
          <input id="pname" className="input" required minLength={2} maxLength={80} value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} />
        </div>
        <div>
          <label htmlFor="sname" className="label">Nombre del remitente</label>
          <input id="sname" className="input" required minLength={2} maxLength={60} value={s.senderName} onChange={(e) => setS({ ...s, senderName: e.target.value })} />
          <p className="hint">Así aparecerás en la bandeja de entrada de tus lectores.</p>
        </div>
        <div>
          <label htmlFor="reply" className="label">Las respuestas llegan a</label>
          <input id="reply" type="email" className="input" maxLength={254} value={s.replyTo} onChange={(e) => setS({ ...s, replyTo: e.target.value })} placeholder={email} />
        </div>
        <div>
          <label htmlFor="day" className="label">Recordatorio semanal</label>
          <select id="day" className="input" value={s.cadenceDay ?? ""} onChange={(e) => setS({ ...s, cadenceDay: e.target.value === "" ? null : Number(e.target.value) })}>
            <option value="">Sin recordatorio</option>
            {DAYS.map((d, i) => (
              <option key={d} value={i}>Cada {d.toLowerCase()} por la mañana</option>
            ))}
          </select>
          <p className="hint">Te escribimos ese día para que le cuentes tu semana al redactor.</p>
        </div>
        {msg && <p role="status" className={`banner ${msg.ok ? "banner-ok" : "banner-err"}`}>{msg.text}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? "Guardando…" : "Guardar"}</button>
      </form>

      <div className="card space-y-3 p-5">
        <h2 className="font-bold">Tu cuenta</h2>
        <p className="text-sm text-muted">Has entrado como <strong className="text-ink">{email}</strong>.</p>
        <div className="flex flex-wrap gap-3">
          <a href="/api/account" className="btn btn-soft">Descargar mis datos</a>
          <form method="post" action="/api/auth/logout"><button className="btn btn-soft">Cerrar sesión</button></form>
          <button type="button" className="btn btn-danger" onClick={deleteAccount}>Borrar mi cuenta</button>
        </div>
      </div>
    </div>
  );
}
