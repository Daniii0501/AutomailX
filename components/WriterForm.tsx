"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Animal from "@/components/Animal";
import WriterAvatar from "@/components/WriterAvatar";
import { ANIMAL_IDS, ANIMALS, type AnimalId } from "@/lib/animals";
import { api } from "@/lib/client";
import { FORMAT_IDS, FORMATS, type FormatId } from "@/lib/formats";
import { CUSTOM_AVATARS, CUSTOM_COLORS, lookOf } from "@/lib/look";
import { EMPTY_CUSTOM, type CustomProfile } from "@/lib/newsletter";

export type WriterValues = {
  kind: "animal" | "custom";
  animal: AnimalId;
  name: string;
  about: string;
  formality: number;
  length: "corto" | "medio" | "largo";
  emojis: number;
  sample: string;
  format: FormatId;
  avatar: string;
  color: string;
  profile: CustomProfile;
};

type Props =
  | { mode: "new"; initial?: undefined; id?: undefined; canDelete?: undefined }
  | { mode: "edit"; initial: WriterValues; id: string; canDelete: boolean };

const DEFAULTS: WriterValues = {
  kind: "animal",
  animal: "zorro",
  name: "",
  about: "",
  formality: 35,
  length: "medio",
  emojis: 1,
  sample: "",
  format: "auto",
  avatar: CUSTOM_AVATARS[0],
  color: CUSTOM_COLORS[0],
  profile: { ...EMPTY_CUSTOM },
};

function Slider({ label, value, onChange, left, right, shown }: { label: string; value: number; onChange: (n: number) => void; left: string; right: string; shown?: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        {shown && <span className="text-muted">{shown}</span>}
      </div>
      <input type="range" min={0} max={100} step={5} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={`${label}: de ${left} a ${right}`} className="w-full accent-[var(--brand)]" />
      <div className="mt-1 flex justify-between text-xs text-muted"><span>{left}</span><span>{right}</span></div>
    </div>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label} {hint && <span className="font-normal text-muted">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export default function WriterForm(props: Props) {
  const router = useRouter();
  const editing = props.mode === "edit";
  const [step, setStep] = useState(editing ? 1 : 0);
  const [v, setV] = useState<WriterValues>(props.initial ?? DEFAULTS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const custom = v.kind === "custom";
  const a = ANIMALS[v.animal];
  const look = lookOf(v);
  const set = <K extends keyof WriterValues>(k: K, val: WriterValues[K]) => setV((p) => ({ ...p, [k]: val }));
  const setP = <K extends keyof CustomProfile>(k: K, val: CustomProfile[K]) => setV((p) => ({ ...p, profile: { ...p.profile, [k]: val } }));

  function pickAnimal(id: AnimalId) {
    setV((p) => ({
      ...p,
      kind: "animal",
      animal: id,
      name: p.name && p.name !== ANIMALS[p.animal].defaultName ? p.name : ANIMALS[id].defaultName,
    }));
    setStep(1);
  }

  function pickCustom() {
    setV((p) => ({ ...p, kind: "custom", name: p.name === ANIMALS[p.animal].defaultName ? "" : p.name }));
    setStep(1);
  }

  async function save() {
    setBusy(true);
    setError(null);
    const r = editing ? await api(`/api/writers/${props.id}`, "PATCH", v) : await api<{ id?: string }>("/api/writers", "POST", v);
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

  // ---------- Paso 0: elegir animal o a medida ----------
  if (step === 0) {
    return (
      <div className="anim-fade-up">
        <h1 className="text-center text-3xl font-bold sm:text-4xl">¿Quién va a escribir por ti?</h1>
        <p className="mx-auto mt-2 max-w-md text-center text-muted">Elige un animal con personalidad o crea un redactor a tu medida.</p>

        <button
          onClick={pickCustom}
          className="card group mt-10 flex w-full items-center gap-5 p-6 text-left transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.99]"
          style={{ background: "linear-gradient(120deg, #efeaff, #fff 60%, #fff1e6)" }}
        >
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-white text-4xl shadow-sm ring-1 ring-black/5 transition group-hover:scale-105" aria-hidden>✍️</span>
          <span>
            <span className="block text-xl font-semibold">Crear mi propio copywriter</span>
            <span className="mt-1 block text-sm text-muted">
              Tú decides cómo escribe: su voz, sus reglas, lo que nunca diría, su estilo de newsletter. Suena exactamente a ti.
            </span>
          </span>
        </button>

        <p className="mb-4 mt-10 text-center text-sm font-medium text-muted">…o empieza con uno de la plantilla</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ANIMAL_IDS.map((id) => {
            const x = ANIMALS[id];
            return (
              <button key={id} onClick={() => pickAnimal(id)} className="card group p-5 text-left transition hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]" style={{ background: `linear-gradient(160deg, ${x.soft}, #fff 70%)` }}>
                <Animal id={id} size={84} className="transition group-hover:scale-105" />
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
          <WriterAvatar w={v} size={96} className="anim-bob" />
          <h1 className="mt-4 text-3xl font-bold">Enséñale cómo escribes</h1>
          <p className="mt-2 text-muted">
            Pega uno o varios textos tuyos (un correo, un post, lo que sea) y {v.name} aprenderá tu ritmo, tus giros y tu forma de abrir y cerrar. {custom ? "Cuantos más, mejor." : "Es opcional."}
          </p>
        </div>
        <textarea value={v.sample} onChange={(e) => set("sample", e.target.value)} rows={10} maxLength={custom ? 6000 : 3000} placeholder="Pega aquí textos que hayas escrito…" className="input mt-8 resize-none leading-relaxed" aria-label="Textos de ejemplo" />
        {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button onClick={() => setStep(1)} className="btn btn-soft">Atrás</button>
          <button onClick={save} disabled={busy} className="btn btn-primary !px-8">
            {busy ? "Creando…" : v.sample.trim() ? `Conocer a ${v.name}` : `Saltar y conocer a ${v.name}`}
          </button>
        </div>
      </div>
    );
  }

  // ---------- Paso 1 (o edición): nombre y estilo ----------
  const formalText = v.formality >= 65 ? "Formal" : v.formality <= 30 ? "Muy cercano" : "Cercano";
  const bubble = custom
    ? v.profile.greeting || (v.name ? `Hola, soy ${v.name}.` : "Hola, soy tu copywriter.")
    : a.greet[v.formality >= 65 ? 1 : 0] + (v.emojis >= 1 && v.formality < 65 ? ` ${a.emoji}` : "");
  const valid = v.name.trim().length >= 2 && (!custom || v.profile.voice.trim().length >= 10);

  return (
    <div className="anim-fade-up mx-auto max-w-xl">
      <div className="flex flex-col items-center text-center">
        <WriterAvatar w={v} size={editing ? 84 : 104} />
        <h1 className="mt-4 text-3xl font-bold">
          {editing ? `Ajustar a ${props.initial.name}` : custom ? "Diseña a tu copywriter" : "Ponle nombre y personalidad"}
        </h1>
        <div className="mt-4 rounded-2xl bg-white px-4 py-2.5 text-[15px] italic shadow-sm ring-1 ring-black/5">«{bubble}»</div>
      </div>

      <div className="mt-8 space-y-6">
        {editing && !custom && (
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

        {custom && (
          <div className="card space-y-4 p-5">
            <div>
              <p className="mb-2 text-sm font-medium">Su cara</p>
              <div className="flex flex-wrap gap-2">
                {CUSTOM_AVATARS.map((e) => (
                  <button key={e} type="button" onClick={() => set("avatar", e)} aria-pressed={v.avatar === e} aria-label={`Avatar ${e}`} className={`grid h-11 w-11 place-items-center rounded-full text-xl ring-2 transition ${v.avatar === e ? "ring-ink" : "ring-transparent hover:ring-line"}`} style={{ background: look.soft }}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Su color</p>
              <div className="flex flex-wrap gap-2">
                {CUSTOM_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => set("color", c)} aria-pressed={v.color === c} aria-label={`Color ${c}`} className={`h-9 w-9 rounded-full ring-2 ring-offset-2 transition ${v.color === c ? "ring-ink" : "ring-transparent"}`} style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <Field id="wname" label="Su nombre">
          <input id="wname" value={v.name} onChange={(e) => set("name", e.target.value)} maxLength={30} className="input" placeholder={custom ? "Ej.: Lola, La Pluma, Mi voz…" : a.defaultName} />
        </Field>

        {custom && (
          <>
            <Field id="wvoice" label="¿Cómo escribe?" hint="(lo más importante)">
              <textarea id="wvoice" value={v.profile.voice} onChange={(e) => setP("voice", e.target.value)} rows={4} maxLength={1500} className="input resize-none" placeholder="Ej.: Escribe como si hablara con una amiga en un bar: frases cortas, humor seco, cero tecnicismos. Le gusta empezar con una anécdota y terminar con una pregunta." />
            </Field>
            <Field id="waud" label="¿Quién lo lee?" hint="(opcional)">
              <textarea id="waud" value={v.profile.audience} onChange={(e) => setP("audience", e.target.value)} rows={2} maxLength={400} className="input resize-none" placeholder="Ej.: Dueños de pequeños negocios de Valencia, entre 30 y 50 años, con poco tiempo." />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="wdos" label="Siempre hace" hint="(opcional)">
                <textarea id="wdos" value={v.profile.dos} onChange={(e) => setP("dos", e.target.value)} rows={3} maxLength={800} className="input resize-none" placeholder="Ej.: Empieza con una escena. Usa ejemplos reales. Cierra con una pregunta." />
              </Field>
              <Field id="wdonts" label="Nunca hace" hint="(opcional)">
                <textarea id="wdonts" value={v.profile.donts} onChange={(e) => setP("donts", e.target.value)} rows={3} maxLength={800} className="input resize-none" placeholder="Ej.: Nada de «sinergias», ni emojis, ni exclamaciones." />
              </Field>
            </div>
            <Field id="wphr" label="Expresiones suyas" hint="(opcional)">
              <input id="wphr" value={v.profile.phrases} onChange={(e) => setP("phrases", e.target.value)} maxLength={500} className="input" placeholder="Ej.: «Vamos al lío», «ojo con esto»" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="wgreet" label="Cómo saluda" hint="(opcional)">
                <input id="wgreet" value={v.profile.greeting} onChange={(e) => setP("greeting", e.target.value)} maxLength={120} className="input" placeholder="Ej.: Buenos días, valientes." />
              </Field>
              <Field id="wsign" label="Cómo se despide" hint="(opcional)">
                <input id="wsign" value={v.profile.signoff} onChange={(e) => setP("signoff", e.target.value)} maxLength={120} className="input" placeholder="Ej.: Hasta el jueves, Lola." />
              </Field>
            </div>
          </>
        )}

        <Field id="wabout" label="Cuéntale quién eres" hint="(opcional)">
          <textarea id="wabout" value={v.about} onChange={(e) => set("about", e.target.value)} rows={3} maxLength={1200} className="input resize-none" placeholder="Soy dueña de una cafetería en Valencia. Mis clientes son del barrio y me gusta hablarles de tú." />
        </Field>

        <div className="card space-y-5 p-5">
          <p className="text-sm font-semibold">Su forma de escribir</p>
          <Slider label="Tono" value={v.formality} onChange={(n) => set("formality", n)} left="Cercano" right="Formal" shown={formalText} />
          {custom && (
            <>
              <Slider label="Humor" value={v.profile.humor} onChange={(n) => setP("humor", n)} left="Serio" right="Muy gracioso" />
              <Slider label="Emoción" value={v.profile.emotion} onChange={(n) => setP("emotion", n)} left="Racional" right="Emotivo" />
            </>
          )}
          <div>
            <p className="mb-2 text-sm font-medium">Longitud</p>
            <div className="flex gap-2">
              {(["corto", "medio", "largo"] as const).map((l) => (
                <button key={l} type="button" aria-pressed={v.length === l} onClick={() => set("length", l)} className="chip flex-1 !py-2.5">{l === "medio" ? "Media" : l === "corto" ? "Corta" : "Larga"}</button>
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
          {custom && (
            <div>
              <label htmlFor="wlang" className="mb-2 block text-sm font-medium">Idioma</label>
              <select id="wlang" value={v.profile.language} onChange={(e) => setP("language", e.target.value as CustomProfile["language"])} className="input">
                <option value="es-ES">Español de España</option>
                <option value="es-419">Español latinoamericano</option>
                <option value="en">English</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <p className="mb-1 text-sm font-medium">Estilo de newsletter por defecto</p>
          <p className="mb-3 text-xs text-muted">Podrás cambiarlo en cada newsletter.</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Estilo por defecto">
            {FORMAT_IDS.map((f) => (
              <button key={f} type="button" aria-pressed={v.format === f} onClick={() => set("format", f)} className="chip">
                <span aria-hidden>{FORMATS[f].emoji}</span> {FORMATS[f].label}
              </button>
            ))}
          </div>
        </div>

        {editing && (
          <Field id="wsample" label="Textos tuyos de ejemplo" hint="(para copiar tu estilo)">
            <textarea id="wsample" value={v.sample} onChange={(e) => set("sample", e.target.value)} rows={6} maxLength={custom ? 6000 : 3000} className="input resize-none" />
          </Field>
        )}
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="mt-8 flex items-center justify-between gap-3">
        {editing ? (
          <button type="button" onClick={() => router.push("/panel")} className="btn btn-soft">Cancelar</button>
        ) : (
          <button type="button" onClick={() => setStep(0)} className="btn btn-soft">Atrás</button>
        )}
        {editing ? (
          <button onClick={save} disabled={busy || !valid} className="btn btn-primary !px-8">{busy ? "Guardando…" : "Guardar"}</button>
        ) : (
          <button onClick={() => setStep(2)} disabled={!valid} className="btn btn-primary !px-8">Siguiente</button>
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
