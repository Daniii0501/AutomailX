import Legal from "@/components/Legal";

export const metadata = { title: "Privacidad · AutoMailX" };

export default function Privacy() {
  return (
    <Legal title="Política de privacidad">
      <p>AutoMailX trata los datos mínimos para que puedas escribir y enviar tu newsletter.</p>
      <h2>Qué datos guardamos</h2>
      <p>Tu correo (para que entres), lo que escribes a tus redactores, tus newsletters y la lista de correos de tus suscriptores.</p>
      <h2>Para qué</h2>
      <p>Solo para darte el servicio: redactar con IA lo que nos cuentas y enviar tus correos. No vendemos datos ni los usamos para publicidad.</p>
      <h2>Con quién se comparten</h2>
      <p>Con los proveedores imprescindibles: Supabase (base de datos, UE), Vercel (alojamiento), Anthropic (redacción con IA) y Resend (envío de correos).</p>
      <h2>Tus derechos</h2>
      <p>Desde Ajustes puedes descargar todos tus datos o borrar tu cuenta en cualquier momento. Tus suscriptores pueden darse de baja con un clic en cada correo.</p>
    </Legal>
  );
}
