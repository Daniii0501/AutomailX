"use client";

import { useState } from "react";
import { api } from "@/lib/client";

export default function SubscribeForm({ slug, color }: { slug: string; color: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [hp, setHp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | { confirm: boolean }>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await api<{ needsConfirm?: boolean }>("/api/public/subscribe", "POST", { slug, email, name, hp });
    setBusy(false);
    if (!r.ok) return setError(r.data.error ?? "No se pudo completar.");
    setDone({ confirm: r.data.needsConfirm !== false });
  }

  if (done) {
    return (
      <div className="anim-fade-up text-center">
        <div className="anim-pop mx-auto grid h-14 w-14 place-items-center rounded-full bg-ok/15 text-2xl text-ok">✓</div>
        <h2 className="mt-4 text-2xl font-semibold">{done.confirm ? "Revisa tu correo" : "¡Ya estás dentro!"}</h2>
        <p className="mt-2 text-muted">
          {done.confirm ? "Te hemos enviado un mensaje para confirmar tu suscripción. Púlsalo y listo." : "Recibirás la próxima newsletter en tu bandeja de entrada."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label htmlFor="sub-name" className="sr-only">Tu nombre (opcional)</label>
      <input id="sub-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre (opcional)" maxLength={80} autoComplete="given-name" className="input" />
      <label htmlFor="sub-email" className="sr-only">Tu correo</label>
      <input id="sub-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" autoComplete="email" inputMode="email" className="input" />
      {/* Trampa para bots: las personas no lo ven. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} name="website" />
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-danger">{error}</p>}
      <button type="submit" disabled={busy || email.length < 5} className="btn w-full !py-3.5 text-white" style={{ background: color }}>
        {busy ? "Un momento…" : "Suscribirme"}
      </button>
      <p className="text-center text-xs text-muted">Te enviaremos un correo para confirmar. Puedes darte de baja cuando quieras.</p>
    </form>
  );
}
