"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import { fecha } from "@/lib/format-utils";

type Row = {
  id: string;
  email: string;
  plan: "free" | "pro";
  is_admin: boolean;
  created_at: string;
  domain: string | null;
  domainStatus: string | null;
  request: { billing: "monthly" | "yearly"; created_at: string } | null;
};

/** Activa aperturas y clics en el dominio compartido (una vez). */
export function TrackingButton() {
  const [state, setState] = useState<{ busy: boolean; ok?: boolean; text?: string }>({ busy: false });
  return (
    <div className="card space-y-2 p-5">
      <p className="font-bold">Aperturas y clics del plan gratis</p>
      <p className="text-sm text-muted">Activa el seguimiento en tu dominio base de Resend. Solo hace falta una vez; los dominios Premium se activan solos.</p>
      <button
        className="btn btn-soft"
        disabled={state.busy}
        onClick={async () => {
          setState({ busy: true });
          try {
            const r = await api<{ domain: string }>("/api/admin/tracking", { body: {} });
            setState({ busy: false, ok: true, text: `Activado en ${r.domain}.` });
          } catch (e) {
            setState({ busy: false, ok: false, text: (e as Error).message });
          }
        }}
      >
        {state.busy ? "Activando…" : "Activar seguimiento"}
      </button>
      {state.text && <p role="status" className={`banner ${state.ok ? "banner-ok" : "banner-err"} text-sm`}>{state.text}</p>}
    </div>
  );
}

export default function AdminUsers({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const shown = rows.filter((r) => r.email.includes(q.trim().toLowerCase()));

  async function setPlan(r: Row, plan: "free" | "pro") {
    if (plan === "free" && !confirm(`¿Pasar ${r.email} al plan gratis? Si tiene dominio propio, dejará de usarse.`)) return;
    setBusy(r.id);
    setErr("");
    try {
      await api(`/api/admin/users/${r.id}`, { method: "PATCH", body: { plan } });
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-3">
      <input className="input" placeholder="Buscar por correo…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar usuario" />
      {err && <p role="alert" className="banner banner-err">{err}</p>}
      <ul className="card divide-y divide-line">
        {shown.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{r.email} {r.is_admin && <span className="pill bg-[#f4f2ef] text-muted">admin</span>}</p>
              {r.request && r.plan !== "pro" && (
                <p className="mt-0.5 text-xs font-semibold text-brand">
                  Quiere Premium {r.request.billing === "yearly" ? "anual" : "mensual"} · lo pidió el {fecha(r.request.created_at, true)}
                </p>
              )}
              <p className="text-xs text-muted">
                Desde el {fecha(r.created_at)}
                {r.domain ? ` · ${r.domain} (${r.domainStatus === "verified" ? "verificado" : "pendiente"})` : ""}
              </p>
            </div>
            <span className={`pill ${r.plan === "pro" ? "bg-[#f1edff] text-brand" : "bg-[#f4f2ef] text-muted"}`}>{r.plan === "pro" ? "Premium" : "Gratis"}</span>
            <button className="btn btn-soft !px-3 !py-1.5 text-sm" disabled={busy === r.id} onClick={() => setPlan(r, r.plan === "pro" ? "free" : "pro")}>
              {busy === r.id ? "…" : r.plan === "pro" ? "Pasar a gratis" : "Hacer Premium"}
            </button>
          </li>
        ))}
        {shown.length === 0 && <li className="px-4 py-6 text-center text-muted">Nadie con ese correo.</li>}
      </ul>
    </div>
  );
}
