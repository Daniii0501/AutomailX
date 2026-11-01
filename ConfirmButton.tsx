"use client";

import { useState } from "react";
import { api } from "@/lib/client";

export default function ConfirmButton({ token, publication }: { token: string; publication: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function go() {
    setState("busy");
    const r = await api("/api/public/confirm", "POST", { token });
    setState(r.ok ? "done" : "error");
  }

  if (state === "done") {
    return (
      <div className="anim-fade-up">
        <div className="anim-pop mx-auto grid h-12 w-12 place-items-center rounded-full bg-ok/15 text-xl text-ok">✓</div>
        <p className="mt-3 text-lg font-semibold">¡Suscripción confirmada!</p>
        <p className="mt-1 text-muted">Ya formas parte de {publication}. Nos vemos en tu bandeja de entrada.</p>
      </div>
    );
  }
  return (
    <>
      <button onClick={go} disabled={state === "busy"} className="btn btn-primary w-full !py-3.5">
        {state === "busy" ? "Un momento…" : "Confirmar mi suscripción"}
      </button>
      {state === "error" && <p role="alert" className="mt-3 text-sm text-danger">No se pudo confirmar. Inténtalo de nuevo.</p>}
    </>
  );
}
