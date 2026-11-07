"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import { fecha } from "@/lib/format-utils";

type DnsRecord = { record: string; name: string; type: string; value: string; ttl?: string; priority?: number; status?: string };
type Domain = { name: string; from_local: string; status: string; records: DnsRecord[]; checked_at: string | null };

type Props = { plan: "free" | "pro"; domain: Domain | null; platformAddress: string; senderName: string };

const STATUS: Record<string, { t: string; c: string }> = {
  verified: { t: "✓ Verificado", c: "bg-[#e9f7f0] text-[#145c3f]" },
  pending: { t: "Comprobando…", c: "bg-[#fff6e8] text-[#6b4a12]" },
  not_started: { t: "Esperando tus DNS", c: "bg-[#fff6e8] text-[#6b4a12]" },
  temporary_failure: { t: "No se encuentran los DNS", c: "bg-[#fdecef] text-[#8a2236]" },
  failed: { t: "Falló la verificación", c: "bg-[#fdecef] text-[#8a2236]" },
};

function Copy({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="shrink-0 rounded-full bg-[#f4f2ef] px-2.5 py-1 text-xs font-semibold hover:bg-[#ebe8e3]"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* sin portapapeles */
        }
      }}
    >
      {done ? "¡Copiado!" : "Copiar"}
    </button>
  );
}

export default function DomainSettings({ plan, domain, platformAddress, senderName }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [local, setLocal] = useState(domain?.from_local ?? "hola");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(kind: string, fn: () => Promise<unknown>, okText?: string) {
    setBusy(kind);
    setMsg(null);
    try {
      await fn();
      if (okText) setMsg({ ok: true, text: okText });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy("");
    }
  }

  const header = (
    <div>
      <h2 className="font-bold">Tu dominio de envío {plan !== "pro" && <span className="pill ml-1 bg-[#f1edff] align-middle text-brand">Premium</span>}</h2>
      <p className="mt-1 text-sm text-muted">
        Ahora tus newsletters salen desde <strong className="text-ink">{senderName} &lt;{domain && domain.status === "verified" && plan === "pro" ? `${domain.from_local}@${domain.name}` : platformAddress}&gt;</strong>.
      </p>
    </div>
  );

  // Plan gratis
  if (plan !== "pro") {
    return (
      <div className="card space-y-3 p-5">
        {header}
        <p className="text-sm">
          Con Premium, tus correos salen desde <strong>tu propio dominio</strong> (por ejemplo <em>hola@tunegocio.com</em>): más confianza, mejor entrega y tu marca en cada envío.
        </p>
        {domain && <p className="banner banner-warn text-sm">Tienes guardado <strong>{domain.name}</strong>, pero solo se usa con Premium.</p>}
        <p className="hint">Pronto podrás activarlo aquí mismo.</p>
      </div>
    );
  }

  // Premium sin dominio
  if (!domain) {
    return (
      <form
        className="card space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          run("add", () => api("/api/domain", { body: { name, local } }), "Dominio añadido. Ahora copia los registros DNS de abajo en tu proveedor.");
        }}
      >
        {header}
        <p className="text-sm">Escribe el dominio de tu negocio. Te daremos unos datos para copiar en la web donde lo compraste (GoDaddy, IONOS, DonDominio, Namecheap, Cloudflare…).</p>
        <div className="grid gap-3 sm:grid-cols-[8rem_auto_1fr] sm:items-end">
          <div>
            <label htmlFor="dlocal" className="label">Dirección</label>
            <input id="dlocal" className="input" value={local} onChange={(e) => setLocal(e.target.value)} maxLength={40} />
          </div>
          <span className="hidden pb-3 text-lg font-semibold text-muted sm:block">@</span>
          <div>
            <label htmlFor="dname" className="label">Tu dominio</label>
            <input id="dname" className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="tunegocio.com" autoCapitalize="none" autoCorrect="off" />
          </div>
        </div>
        {name && <p className="hint">Tus lectores verán: <strong>{senderName} &lt;{local || "hola"}@{name.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "")}&gt;</strong></p>}
        {msg && <p role="status" className={`banner ${msg.ok ? "banner-ok" : "banner-err"}`}>{msg.text}</p>}
        <button className="btn btn-primary" disabled={busy === "add" || name.trim().length < 4}>{busy === "add" ? "Añadiendo…" : "Añadir dominio"}</button>
      </form>
    );
  }

  // Premium con dominio
  const st = STATUS[domain.status] ?? STATUS.pending;
  const verified = domain.status === "verified";
  return (
    <div className="card min-w-0 space-y-4 p-5">
      {header}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{domain.name}</span>
        <span className={`pill ${st.c}`}>{st.t}</span>
        {domain.checked_at && <span className="text-xs text-muted">comprobado el {fecha(domain.checked_at, true)}</span>}
      </div>

      {msg && <p role="status" className={`banner ${msg.ok ? "banner-ok" : "banner-err"}`}>{msg.text}</p>}

      {!verified && (
        <div className="space-y-3">
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>Entra en la web donde compraste <strong>{domain.name}</strong> y busca la sección <strong>DNS</strong> (a veces se llama «Zona DNS» o «Registros»).</li>
            <li>Añade <strong>cada registro</strong> de la lista, copiando el tipo, el nombre y el valor tal cual.</li>
            <li>Vuelve aquí y pulsa <strong>Comprobar ahora</strong>. Suele tardar unos minutos, aunque a veces hasta un día.</li>
          </ol>
          <ul className="space-y-2">
            {domain.records.map((r, i) => (
              <li key={i} className="min-w-0 overflow-hidden rounded-2xl border border-line p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="pill bg-ink text-white">{r.type}</span>
                  <span className="text-xs text-muted">{r.record}</span>
                  {r.priority !== undefined && <span className="text-xs text-muted">· Prioridad {r.priority}</span>}
                  {r.status === "verified" && <span className="pill bg-[#e9f7f0] text-[#145c3f]">✓</span>}
                </div>
                <div className="mt-2 min-w-0 space-y-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="w-14 shrink-0 text-xs text-muted">Nombre</span>
                    <code className="min-w-0 flex-1 truncate rounded-lg bg-[#faf9f7] px-2 py-1">{r.name || "@"}</code>
                    <Copy value={r.name || "@"} />
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="w-14 shrink-0 text-xs text-muted">Valor</span>
                    <code className="min-w-0 flex-1 truncate rounded-lg bg-[#faf9f7] px-2 py-1" title={r.value}>{r.value}</code>
                    <Copy value={r.value} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="hint">Si tu proveedor pide el nombre completo, añade «.{domain.name}» al final (por ejemplo <code>send.{domain.name}</code>).</p>
          <button className="btn btn-primary" disabled={!!busy} onClick={() => run("check", () => api("/api/domain/check", { body: {} }))}>
            {busy === "check" ? "Comprobando…" : "Comprobar ahora"}
          </button>
        </div>
      )}

      {verified && (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            run("local", () => api("/api/domain", { method: "PATCH", body: { local } }), "Dirección guardada.");
          }}
        >
          <label htmlFor="vlocal" className="label">Dirección de envío</label>
          <div className="flex items-center gap-2">
            <input id="vlocal" className="input max-w-[12rem]" value={local} onChange={(e) => setLocal(e.target.value)} maxLength={40} />
            <span className="font-semibold text-muted">@{domain.name}</span>
          </div>
          <button className="btn btn-soft" disabled={!!busy || local === domain.from_local}>{busy === "local" ? "Guardando…" : "Guardar"}</button>
        </form>
      )}

      <button
        type="button"
        className="text-sm font-semibold text-danger underline"
        disabled={!!busy}
        onClick={() => {
          if (confirm(`¿Quitar ${domain.name}? Tus newsletters volverán a salir desde ${platformAddress}.`)) run("del", () => api("/api/domain", { method: "DELETE" }));
        }}
      >
        Quitar este dominio
      </button>
    </div>
  );
}
