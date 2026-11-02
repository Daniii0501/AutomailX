"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ANIMALS, ANIMAL_IDS, type AnimalId } from "@/lib/animals";
import { api } from "@/lib/client";
import { FORMATS, FORMAT_IDS } from "@/lib/formats";
import { EMPTY_CUSTOM, lookOf, type WriterProfile } from "@/lib/newsletter";
import Animal from "./Animal";
import WriterAvatar from "./WriterAvatar";

const AVATARS = ["✍️", "🦄", "🐧", "🦁", "🐼", "🐸", "🦋", "🌵", "☕", "🚀", "🎸", "🌻", "🧠", "🤖", "👩‍🍳", "🧑‍💼"];
const COLORS = ["#6d4aff", "#ff8a3d", "#1f9d6b", "#d6405a", "#2f80ed", "#c050d8", "#e0a100", "#17171a"];

function Chips<T extends string | number>({ value, options, onChange, label }: { value: T; options: { v: T; t: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={String(o.v)} type="button" className="chip" aria-pressed={value === o.v} onClick={() => onChange(o.v)}>
            {o.t}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Slider({ id, label, value, onChange, left, right }: { id: string; label: string; value: number; onChange: (n: number) => void; left: string; right: string }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} type="range" min={0} max={100} step={5} value={value} onChange={(e) => onChange(Number(e.target.value))} className="range" />
      <div className="flex justify-between text-xs text-muted"><span>{left}</span><span>{right}</span></div>
    </div>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export default function WriterForm({ initial, kind: initialKind = "animal", animal: initialAnimal = "zorro" }: { initial?: WriterProfile; kind?: "animal" | "custom"; animal?: AnimalId }) {
  const router = useRouter();
  const editing = !!initial?.id;
  const [w, setW] = useState<WriterProfile>(
    initial ?? {
      kind: initialKind,
      animal: initialAnimal,
      name: initialKind === "animal" ? ANIMALS[initialAnimal].defaultName : "",
      avatar: "✍️",
      color: "#6d4aff",
      about: "",
      formality: 35,
      length: "medio",
      emojis: 1,
      sample: "",
      format: "auto",
      custom: { ...EMPTY_CUSTOM },
    },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof WriterProfile>(k: K, v: WriterProfile[K]) => setW((p) => ({ ...p, [k]: v }));
  const setC = <K extends keyof WriterProfile["custom"]>(k: K, v: WriterProfile["custom"][K]) => setW((p) => ({ ...p, custom: { ...p.custom, [k]: v } }));

  function pickAnimal(id: AnimalId) {
    setW((p) => ({ ...p, animal: id, name: !p.name || ANIMAL_IDS.some((a) => ANIMALS[a].defaultName === p.name) ? ANIMALS[id].defaultName : p.name }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editing) await api(`/api/writers/${initial!.id}`, { method: "PATCH", body: w });
      else await api("/api/writers", { body: w });
      router.push("/panel");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo ha fallado.");
      setBusy(false);
    }
  }

  async function del() {
    if (!confirm(`¿Despedir a ${w.name}? Sus newsletters se quedan en tu historial.`)) return;
    setBusy(true);
    try {
      await api(`/api/writers/${initial!.id}`, { method: "DELETE" });
      router.push("/panel");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo ha fallado.");
      setBusy(false);
    }
  }

  const look = lookOf(w);

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="card flex items-center gap-4 p-5">
        <WriterAvatar look={look} size={72} />
        <div>
          <p className="text-xl font-bold">{w.name || "Sin nombre"}</p>
          <p className="text-sm text-muted">{w.kind === "animal" ? `${ANIMALS[w.animal].tagline} · ${ANIMALS[w.animal].bestFor}` : "Redactor a medida"}</p>
        </div>
      </div>

      <div className="card space-y-5 p-5">
        <div role="tablist" aria-label="Tipo de redactor" className="inline-flex rounded-full border border-line bg-white p-1">
          {(["animal", "custom"] as const).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={w.kind === k} onClick={() => set("kind", k)} className="tab rounded-full px-4 py-1.5 text-sm font-semibold">
              {k === "animal" ? "Con personalidad" : "A medida"}
            </button>
          ))}
        </div>

        {w.kind === "animal" ? (
          <fieldset>
            <legend className="label">Elige su personalidad</legend>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {ANIMAL_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => pickAnimal(id)}
                  aria-pressed={w.animal === id}
                  className={`flex flex-col items-center rounded-2xl border p-2 text-xs transition ${w.animal === id ? "border-ink bg-[#f4f2ef]" : "border-line bg-white hover:bg-[#faf9f7]"}`}
                >
                  <Animal id={id} size={52} />
                  <span className="mt-1 font-semibold">{ANIMALS[id].species}</span>
                </button>
              ))}
            </div>
            <p className="hint">{ANIMALS[w.animal].species}: {ANIMALS[w.animal].tagline.toLowerCase()}. Ideal para {ANIMALS[w.animal].bestFor.toLowerCase()}.</p>
          </fieldset>
        ) : (
          <>
            <fieldset>
              <legend className="label">Su cara</legend>
              <div className="flex flex-wrap gap-1.5">
                {AVATARS.map((a) => (
                  <button key={a} type="button" onClick={() => set("avatar", a)} aria-pressed={w.avatar === a} aria-label={`Avatar ${a}`}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xl ${w.avatar === a ? "ring-2 ring-ink" : "bg-[#f4f2ef]"}`}>
                    {a}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => set("color", c)} aria-pressed={w.color === c} aria-label={`Color ${c}`}
                    className={`h-8 w-8 rounded-full ${w.color === c ? "ring-2 ring-ink ring-offset-2" : ""}`} style={{ background: c }} />
                ))}
              </div>
            </fieldset>
            <Field id="voice" label="¿Cómo escribe? (su voz)" hint="Ej.: directo y con humor, frases cortas, como un amigo que sabe de café.">
              <textarea id="voice" className="input" rows={2} maxLength={600} value={w.custom.voice} onChange={(e) => setC("voice", e.target.value)} />
            </Field>
            <Field id="audience" label="¿Quién lo lee?" hint="Ej.: clientes de mi cafetería, de 25 a 45 años, del barrio.">
              <input id="audience" className="input" maxLength={400} value={w.custom.audience} onChange={(e) => setC("audience", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="dos" label="Siempre…" hint="Ej.: terminar con una pregunta.">
                <textarea id="dos" className="input" rows={2} maxLength={600} value={w.custom.dos} onChange={(e) => setC("dos", e.target.value)} />
              </Field>
              <Field id="donts" label="Nunca…" hint="Ej.: usar «increíble» ni hablar de precios.">
                <textarea id="donts" className="input" rows={2} maxLength={600} value={w.custom.donts} onChange={(e) => setC("donts", e.target.value)} />
              </Field>
            </div>
            <Field id="phrases" label="Expresiones suyas" hint="Muletillas o frases que te representan (separadas por comas).">
              <input id="phrases" className="input" maxLength={400} value={w.custom.phrases} onChange={(e) => setC("phrases", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="greeting" label="Saludo exacto" hint="Déjalo vacío para que lo invente cada vez.">
                <input id="greeting" className="input" maxLength={120} value={w.custom.greeting} onChange={(e) => setC("greeting", e.target.value)} />
              </Field>
              <Field id="signoff" label="Despedida exacta">
                <input id="signoff" className="input" maxLength={80} value={w.custom.signoff} onChange={(e) => setC("signoff", e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Slider id="humor" label="Humor" value={w.custom.humor} onChange={(n) => setC("humor", n)} left="Serio" right="Muy gracioso" />
              <Slider id="emotion" label="Emoción" value={w.custom.emotion} onChange={(n) => setC("emotion", n)} left="Racional" right="Muy emotivo" />
            </div>
            <Field id="language" label="Idioma">
              <select id="language" className="input" value={w.custom.language} onChange={(e) => setC("language", e.target.value as WriterProfile["custom"]["language"])}>
                <option value="es-ES">Español de España</option>
                <option value="es-419">Español latinoamericano</option>
                <option value="en">Inglés</option>
              </select>
            </Field>
          </>
        )}

        <Field id="name" label="Su nombre">
          <input id="name" className="input" required minLength={2} maxLength={40} value={w.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
      </div>

      <div className="card space-y-5 p-5">
        <h2 className="font-bold">Cómo quieres que escriba</h2>
        <Slider id="formality" label="Tono" value={w.formality} onChange={(n) => set("formality", n)} left="Muy cercano" right="Formal" />
        <Chips label="Largo" value={w.length} onChange={(v) => set("length", v)} options={[{ v: "corto", t: "Corto" }, { v: "medio", t: "Medio" }, { v: "largo", t: "Largo" }]} />
        <Chips label="Emojis" value={w.emojis} onChange={(v) => set("emojis", v)} options={[{ v: 0, t: "Ninguno" }, { v: 1, t: "Alguno" }, { v: 2, t: "Con alegría" }]} />
        <fieldset>
          <legend className="label">Estilo habitual</legend>
          <div className="flex flex-wrap gap-2">
            {FORMAT_IDS.map((id) => (
              <button key={id} type="button" className="chip" aria-pressed={w.format === id} onClick={() => set("format", id)}>
                {FORMATS[id].emoji} {id === "auto" ? "Que decida" : FORMATS[id].label}
              </button>
            ))}
          </div>
        </fieldset>
        <Field id="about" label="Sobre ti o tu negocio" hint="Contexto que siempre debe tener en cuenta. No hace falta que sea largo.">
          <textarea id="about" className="input" rows={3} maxLength={1200} value={w.about} onChange={(e) => set("about", e.target.value)}
            placeholder="Ej.: Tengo una cafetería de especialidad en Malasaña. Abrimos en 2021. Me importa el trato cercano." />
        </Field>
        <Field id="sample" label="Un texto tuyo para imitar (opcional)" hint="Pega un correo o post que hayas escrito: copiará tu ritmo, no el contenido.">
          <textarea id="sample" className="input" rows={4} maxLength={3000} value={w.sample} onChange={(e) => set("sample", e.target.value)} />
        </Field>
      </div>

      {error && <p role="alert" className="banner banner-err">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={busy}>{editing ? "Guardar cambios" : `Contratar a ${w.name || "mi redactor"}`}</button>
        <button type="button" className="btn btn-soft" onClick={() => router.back()} disabled={busy}>Cancelar</button>
        {editing && <button type="button" className="btn btn-danger ml-auto" onClick={del} disabled={busy}>Despedir</button>}
      </div>
    </form>
  );
}
