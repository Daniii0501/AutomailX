"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

export default function EnterButton({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    const r = await api<{ dest?: string }>("/api/auth/verify", "POST", { token });
    if (!r.ok || !r.data.dest) {
      setBusy(false);
      setError(r.data.error ?? "No se pudo entrar.");
      return;
    }
    router.push(r.data.dest);
    router.refresh();
  }

  return (
    <>
      <button onClick={go} disabled={busy || !token} className="btn btn-primary w-full !py-3.5">
        {busy ? "Entrando…" : "Entrar en AutoMailX"}
      </button>
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">
          {error} <a href="/login" className="underline">Pedir otro</a>
        </p>
      )}
    </>
  );
}
