import Link from "next/link";
import Brand from "@/components/Brand";

export const metadata = { title: "Términos · AutoMailX" };

export default function Terms() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <Brand />
      <h1 className="mt-10 text-4xl font-bold">Términos de uso</h1>
      <p className="mt-4 rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
        Borrador: revisa y completa este texto con un profesional antes de lanzar.
      </p>
      <div className="mt-8 space-y-5 leading-relaxed text-muted [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink">
        <h2>El servicio</h2>
        <p>AutoMailX te ayuda a redactar y enviar newsletters con un redactor de IA. Tú revisas y apruebas siempre cada envío.</p>
        <h2>Uso responsable</h2>
        <p>Solo puedes escribir a personas que te hayan dado permiso. Está prohibido el spam, el contenido ilegal o engañoso y el envío a listas compradas.</p>
        <h2>Contenido generado por IA</h2>
        <p>La IA puede cometer errores. Eres responsable de lo que envías: revisa el texto antes de enviarlo.</p>
        <h2>Cuenta y cancelación</h2>
        <p>Puedes borrar tu cuenta en cualquier momento desde Ajustes. Podemos suspender cuentas que incumplan estas normas.</p>
        <h2>Contacto</h2>
        <p>[Añade aquí el correo de contacto y los datos del titular.]</p>
      </div>
      <Link href="/" className="mt-10 inline-block text-sm text-muted underline">← Volver</Link>
    </main>
  );
}
