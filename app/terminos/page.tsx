import Legal from "@/components/Legal";

export const metadata = { title: "Términos · AutoMailX" };

export default function Terms() {
  return (
    <Legal title="Términos de uso">
      <p>Al usar AutoMailX aceptas estas condiciones.</p>
      <h2>Tu contenido</h2>
      <p>Lo que escribes y envías es tuyo y eres responsable de ello. Revisa cada newsletter antes de enviarla: la IA puede equivocarse.</p>
      <h2>Tu lista</h2>
      <p>Solo puedes escribir a personas que te hayan dado permiso. Está prohibido el spam y comprar listas de correos.</p>
      <h2>Plan gratuito</h2>
      <p>El plan gratuito tiene límites de uso que pueden cambiar. Podemos suspender cuentas que abusen del servicio.</p>
      <h2>Sin garantías</h2>
      <p>El servicio se ofrece tal cual, sin garantía de disponibilidad continua.</p>
    </Legal>
  );
}
