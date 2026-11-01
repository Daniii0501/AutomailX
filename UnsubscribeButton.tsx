"use client";

import { useState } from "react";
import { api } from "@/lib/client";

export default function UnsubscribeButton({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function go() {
    setState("busy");
    const r = await api("/api/public/unsubscribe", "POST", { token });
    setState(r.ok ? "done" : "error");
  }

  if (state === "done") {
    return <p className="anim-fade-up rounded-xl bg-ok/10 px-4 py-3 font-medium text-ok">Listo, te has dado de baja. No recibirás más correos.</p>;
  }
  return (
    <>
      <button onClick={go} disabled={state === "busy"} className="btn btn-primary w-full !py-3.5">
        {state === "busy" ? "Un momento…" : "Sí, darme de baja"}
      </button>
      {state === "error" && <p role="alert" className="mt-3 text-sm text-danger">No se pudo completar. Inténtalo de nuevo.</p>}
    </>
  );
}
