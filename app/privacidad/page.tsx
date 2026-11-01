import Link from "next/link";
import Brand from "@/components/Brand";

export const metadata = { title: "Privacidad · AutoMailX" };

export default function Privacy() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <Brand />
      <h1 className="mt-10 text-4xl font-bold">Política de privacidad</h1>
      <p className="mt-4 rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
        Borrador: revisa y completa este texto con un profesional (datos del responsable, plazos y bases legales) antes de lanzar.
      </p>
      <div className="mt-8 space-y-5 leading-relaxed text-muted [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink">
        <h2>Qué datos guardamos</h2>
        <p>Tu correo (para entrar), los textos que escribes para generar newsletters, tus redactores y los correos de tus suscriptores.</p>
        <h2>Para qué los usamos</h2>
        <p>Solo para ofrecerte el servicio: permitirte entrar, generar y enviar tus newsletters. No vendemos tus datos.</p>
        <h2>Inteligencia artificial</h2>
        <p>Para redactar, enviamos tus notas a un proveedor de IA. No uses el servicio para datos sensibles de terceros.</p>
        <h2>Tus suscriptores</h2>
        <p>Tú eres el responsable de tener permiso de las personas a las que escribes. Cada correo incluye un enlace para darse de baja, y las altas desde tu formulario requieren confirmación.</p>
        <h2>Tus derechos</h2>
        <p>Puedes borrar tu cuenta y todos tus datos desde Ajustes, y pedir acceso o rectificación escribiéndonos.</p>
        <h2>Contacto</h2>
        <p>[Añade aquí el correo de contacto y los datos del responsable.]</p>
      </div>
      <Link href="/" className="mt-10 inline-block text-sm text-muted underline">← Volver</Link>
    </main>
  );
}
