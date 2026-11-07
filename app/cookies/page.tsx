import Legal from "@/components/Legal";
import { BRAND } from "@/lib/legal";

export const metadata = { title: "Política de cookies · AutoMailX" };

export default function Cookies() {
  return (
    <Legal title="Política de cookies" intro={`${BRAND} usa el mínimo imprescindible: solo una cookie técnica para que puedas tener la sesión iniciada. No usamos cookies de publicidad, de analítica ni de redes sociales.`}>
      <h2>1. Qué cookies usamos</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr><th className="py-2 pr-3 font-medium">Nombre</th><th className="py-2 pr-3 font-medium">Para qué</th><th className="py-2 pr-3 font-medium">Duración</th><th className="py-2 font-medium">Tipo</th></tr>
          </thead>
          <tbody>
            <tr className="border-t border-line align-top">
              <td className="py-2 pr-3"><code>amx_session</code></td>
              <td className="py-2 pr-3">Mantener tu sesión iniciada en el panel.</td>
              <td className="py-2 pr-3">30 días o hasta que cierres sesión</td>
              <td className="py-2">Propia, técnica</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Esta cookie es estrictamente necesaria para prestar el servicio que pides, por lo que, según el artículo 22.2 de la LSSI y la guía de la Agencia Española
        de Protección de Datos, no necesita tu consentimiento. Por eso no te mostramos un banner de cookies.
      </p>

      <h2>2. Pago con Stripe</h2>
      <p>Cuando pagas Premium, lo haces en la página de Stripe (checkout.stripe.com), que usa sus propias cookies técnicas y de prevención del fraude. Puedes consultarlas en la política de cookies de Stripe.</p>

      <h2>3. Cómo borrarlas</h2>
      <p>Puedes borrar o bloquear las cookies desde la configuración de tu navegador. Si bloqueas la cookie de sesión, no podrás entrar en tu panel.</p>

      <h2>4. Cambios</h2>
      <p>Si algún día añadimos cookies que no sean técnicas (por ejemplo, de analítica), te pediremos permiso antes de usarlas y actualizaremos esta página.</p>
    </Legal>
  );
}
