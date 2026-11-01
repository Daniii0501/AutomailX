"use client";

import { useState } from "react";
import { api } from "@/lib/client";

export default function LoginForm({ hadError }: { hadError: boolean }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(hadError ? "Ese enlace ya no es válido. Pide uno nuevo." : null);
  const [sent, setSent] = useState<{ demoLink?: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await api<{ demo?: boolean; link?: string }>("/api/auth/request", "POST", { email });
    setBusy(false);
    if (!r.ok) {
      setError(r.data.error ?? "No se pudo enviar el enlace.");
      return;
    }
    setSent({ demoLink: r.data.demo ? r.data.link : undefined });
  }

  if (sent) {
    return (
      <div className="anim-fade-up text-center">
        <div className="anim-pop mx-auto grid h-14 w-14 place-items-center rounded-full bg-ok/15 text-2xl text-ok">✓</div>
        {sent.demoLink ? (
          <>
            <h2 className="mt-5 text-2xl font-semibold">Modo demo</h2>
            <p className="mt-2 text-muted">
              Aún no hay envío de correo configurado, así que puedes entrar directamente desde aquí.
            </p>
            <a href={sent.demoLink} className="btn btn-primary mt-6 w-full">Entrar ahora</a>
          </>
        ) : (
          <>
            <h2 className="mt-5 text-2xl font-semibold">Revisa tu correo</h2>
            <p className="mt-2 text-muted">
              Te hemos enviado un enlace a <b className="text-ink">{email}</b>. Púlsalo y entrarás directamente. Caduca en 15 minutos.
            </p>
            <button onClick={() => setSent(null)} className="mt-6 text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
              Usar otro correo
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label htmlFor="email" className="sr-only">Correo electrónico</label>
      <input
        id="email"
        type="email"
        required
        autoFocus
        autoComplete="email"
        inputMode="email"
        placeholder="tu@correo.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input text-center text-lg"
      />
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-danger">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy || email.length < 5} className="btn btn-primary w-full !py-3.5">
        {busy ? "Un momento…" : "Continuar"}
      </button>
      <p className="pt-1 text-center text-xs text-muted">
        Sin contraseñas. Te enviamos un enlace para entrar. Al continuar aceptas los{" "}
        <a href="/terminos" className="underline">términos</a> y la <a href="/privacidad" className="underline">privacidad</a>.
      </p>
    </form>
  );
}
