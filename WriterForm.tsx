"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Animal from "@/components/Animal";
import { ANIMAL_IDS, ANIMALS, type AnimalId } from "@/lib/animals";
import { api } from "@/lib/client";

export type WriterValues = {
  animal: AnimalId;
  name: string;
  about: string;
  formality: number;
  length: "corto" | "medio" | "largo";
  emojis: number;
  sample: string;
};

type Props =
  | { mode: "new"; initial?: undefined; id?: undefined; canDelete?: undefined }
  | { mode: "edit"; initial: WriterValues; id: string; canDelete: boolean };

const DEFAULTS: WriterValues = { animal: "zorro", name: "", about: "", formality: 35, length: "medio", emojis: 1, sample: "" };

export default function WriterForm(props: Props) {
  const router = useRouter();
  const editing = props.mode === "edit";
  const [step, setStep] = useState(editing ? 1 : 0);
  const [v, setV] = useState<WriterValues>(props.initial ?? DEFAULTS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const a = ANIMALS[v.animal];
  const set = <K extends keyof WriterValues>(k: K, val: WriterValues[K]) => setV((p) => ({ ...p, [k]: val }));

  function pick(id: AnimalId) {
    setV((p) => ({ ...p, animal: id, name: p.name && p.name !== ANIMALS[p.animal].defaultName ? p.name : ANIMALS[id].defaultName }));
    setStep(1);
  }

  async function save() {
    setBusy(true);
    setError(null);
    const r = editing
      ? await api(`/api/writers/${props.id}`, "PATCH", v)
      : await api<{ id?: string }>("/api/writers", "POST", v);
    setBusy(false);
    if (!r.ok) {
      setError(r.data.error ?? "No se pudo guardar.");
      return;
    }
    router.push("/panel");
    router.refresh();
  }

  async function remove() {
    if (!editing || !confirm(`¿Seguro que quieres despedir a ${v.name}? Sus borradores se borrarán.`)) return;
    setBusy(true);
    const r = await api(`/api/writers/${props.id}`, "DELETE");
    setBusy(false);
    if (!r.ok) {
      setError(r.data.error ?? "No se pudo borrar.");
      return;
    }
    router.push("/panel");
    router.refresh();
  }

  // ---------- Paso 0: elegir animal ----------
  if (step === 0) {
    return (
      <div className="anim-fade-up">
        <h1 className="text-center text-3xl font-bold sm:text-4xl">¿Quién va a escribir por ti?</h1>
        <p className="mx-auto mt-2 max-w-md text-center text-muted">Elige a tu redactor. Podrás cambiarle el nombre y la forma de escribir después.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ANIMAL_IDS.map((id) => {
            const x = ANIMALS[id];
            return (
              <button
                key={id}
                onClick={() => pick(id)}
                className="card group p-5 text-left transition hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]"
                style={{ background: `linear-gradient(160deg, ${x.soft}, #fff 70%)` }}
              >
                <Animal id={id} size={92} className="transition group-hover:scale-105" />
                <p className="mt-3 text-lg font-semibold">{x.species}</p>
                <p className="text-sm font-medium" style={{ color: x.color }}>{x.tagline}</p>
                <p className="mt-1 text-sm text-muted">Ideal para: {x.bestFor.toLowerCase()}.</p>
                <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-sm italic">«{x.greet[0]}»</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ---------- Paso 2: enseñarle ----------
  if (step === 2 && !editing) {
    return (
      <div className="anim-fade-up mx-auto max-w-xl">
        <div className="flex flex-col items-center text-center">
          <Animal id={v.animal} size={96} className="anim-bob" />
          <h1 className="mt-4 text-3xl font-bold">Enséñale cómo escribes</h1>
          <p className="mt-2 text-muted">Pega un texto tuyo (un correo, un post, lo que sea) y {v.name} aprenderá tu estilo. Es opcional.</p>
        </div>
        <textarea value={v.sample} onChange={(e) => set("sample", e.target.value)} rows={8} placeholder="Pega aquí un texto que hayas escrito…" className="input mt-8 resize-none leading-relaxed" aria-label="Texto de ejemplo" />
        {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button onClick={() => setStep(1)} className="btn btn-soft">Atrás</button>
          <button onClick={save} disabled={busy} className="btn btn-primary !px-8">
            {busy ? "Creando…" : v.sample.trim() ? `Conocer a ${v.name}` : "Saltar y conocer a " + v.name}
          </button>
        </div>
      </div>
    );
  }

  // ---------- Paso 1 (o edición): nombre y estilo ----------
  const formalText = v.formality >= 65 ? "Formal" : v.formality <= 30 ? "Muy cercano" : "Cercano";
  const bubble = a.greet[v.formality >= 65 ? 1 : 0] + (v.emojis >= 1 && v.formality < 65 ? ` ${a.emoji}` : "");

  return (
    <div className="anim-fade-up mx-auto max-w-xl">
      <div className="flex flex-col items-center text-center">
        <Animal id={v.animal} size={editing ? 84 : 104} />
        <h1 className="mt-4 text-3xl font-bold">{editing ? `Ajustar a ${props.initial.name}` : "Ponle nombre y personalidad"}</h1>
        <div className="mt-4 rounded-2xl bg-white px-4 py-2.5 text-[15px] italic shadow-sm ring-1 ring-black/5">«{bubble}»</div>
      </div>

      <div className="mt-8 space-y-6">
        {editing && (
          <div>
            <p className="mb-2 text-sm font-medium">Animal</p>
            <div className="flex flex-wrap gap-2">
              {ANIMAL_IDS.map((id) => (
                <button key={id} type="button" onClick={() => set("animal", id)} aria-pressed={v.animal === id} aria-label={ANIMALS[id].species} className={`rounded-full p-1 ring-2 transition ${v.animal === id ? "ring-ink" : "ring-transparent hover:ring-line"}`}>
                  <Animal id={id} size={44} />
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="wname" className="mb-2 block text-sm font-medium">Su nombre</label>
          <input id="wname" value={v.name} onChange={(e) => set("name", e.target.value)} maxLength={30} className="input" placeholder={a.defaultName} />
        </div>

        <div>
          <label htmlFor="wabout" className="mb-2 block text-sm font-medium">Cuéntale quién eres <span className="font-normal text-muted">(opcional)</span></label>
          <textarea id="wabout" value={v.about} onChange={(e) => set("about", e.target.value)} rows={3} maxLength={1200} className="input resize-none" placeholder="Soy dueña de una cafetería en Valencia. Mis clientes son del barrio y me gusta hablarles de tú." />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Tono</span>
            <span className="text-muted">{formalText}</span>
          </div>
          <input type="range" min={0} max={100} step={5} value={v.formality} onChange={(e) => set("formality", Number(e.target.value))} aria-label="Tono, de cercano a formal" className="w-full accent-[var(--brand)]" />
          <div className="mt-1 flex justify-between text-xs text-muted"><span>Cercano</span><span>Formal</span></div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Longitud</p>
          <div className="flex gap-2">
            {(["corto", "medio", "largo"] as const).map((l) => (
              <button key={l} type="button" aria-pressed={v.length === l} onClick={() => set("length", l)} className="chip flex-1 !py-2.5 capitalize">{l === "medio" ? "Media" : l === "corto" ? "Corta" : "Larga"}</button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Emojis</p>
          <div className="flex gap-2">
            {["Ninguno", "Algunos", "Muchos"].map((l, i) => (
              <button key={l} type="button" aria-pressed={v.emojis === i} onClick={() => set("emojis", i)} className="chip flex-1 !py-2.5">{l}</button>
            ))}
          </div>
        </div>

        {editing && (
          <div>
            <label htmlFor="wsample" className="mb-2 block text-sm font-medium">Texto tuyo de ejemplo <span className="font-normal text-muted">(para copiar tu estilo)</span></label>
            <textarea id="wsample" value={v.sample} onChange={(e) => set("sample", e.target.value)} rows={5} maxLength={3000} className="input resize-none" />
          </div>
        )}
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="mt-8 flex items-center justify-between gap-3">
        {editing ? (
          <button type="button" onClick={() => router.push("/panel")} className="btn btn-soft">Cancelar</button>
        ) : (
          <button type="button" onClick={() => setStep(0)} className="btn btn-soft">Cambiar animal</button>
        )}
        {editing ? (
          <button onClick={save} disabled={busy || v.name.trim().length < 2} className="btn btn-primary !px-8">{busy ? "Guardando…" : "Guardar"}</button>
        ) : (
          <button onClick={() => setStep(2)} disabled={v.name.trim().length < 2} className="btn btn-primary !px-8">Siguiente</button>
        )}
      </div>

      {editing && props.canDelete && (
        <div className="mt-10 border-t border-line pt-6 text-center">
          <button onClick={remove} disabled={busy} className="text-sm text-danger hover:underline">Despedir a {props.initial.name}</button>
        </div>
      )}
    </div>
  );
}
