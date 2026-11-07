"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import { fecha } from "@/lib/format-utils";

type Row = { id: string; email: string; plan: "free" | "pro"; is_admin: boolean; created_at: string; domain: string | null; domainStatus: string | null };

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
