import Legal, { ContactEmail, Owner } from "@/components/Legal";
import { BRAND, DESISTIMIENTO_DIAS } from "@/lib/legal";
import { FREE, priceLabel } from "@/lib/plans";

export const metadata = { title: "Términos y condiciones · AutoMailX" };

export default function Terminos() {
  return (
    <Legal title="Términos y condiciones" intro={`Estas condiciones regulan el uso de ${BRAND} y la contratación del plan Premium. Al crear tu cuenta las aceptas.`}>
      <h2>1. Quién presta el servicio</h2>
      <p><Owner field="name" />, con NIF <Owner field="nif" /> y domicilio en <Owner field="address" />. Contacto: <ContactEmail />.</p>

      <h2>2. El servicio</h2>
      <p>
        {BRAND} te permite redactar newsletters con ayuda de inteligencia artificial, gestionar tu lista de suscriptores, enviar tus newsletters por correo y
        consultar sus métricas. Para usarlo necesitas una cuenta, que creas entrando con tu correo. Debes ser mayor de edad y, si contratas en nombre de un
        negocio, tener capacidad para hacerlo.
      </p>

      <h2>3. Planes</h2>
      <ul>
        <li>
          <strong>Gratis:</strong> sin coste, con límites de uso ({FREE.writesPerWeek} newsletters a la semana, {FREE.writers} redactores y hasta {FREE.subscribers} suscriptores, entre otros).
          Los límites pueden cambiar; te avisaremos con antelación.
        </li>
        <li>
          <strong>Premium:</strong> {priceLabel()} al mes, IVA incluido. Incluye newsletters sin límite (sujetas a un uso razonable para evitar abusos) y el envío desde tu
          propio dominio, una vez verificado.
        </li>
      </ul>

      <h2>4. Pago, renovación y cancelación</h2>
      <ul>
        <li>Premium se paga por adelantado con tarjeta a través de Stripe y se <strong>renueva automáticamente cada mes</strong> hasta que lo canceles.</li>
        <li><strong>Puedes cancelar cuando quieras</strong>, sin permanencia ni penalización, desde «Gestionar mi suscripción». Mantienes Premium hasta el final del mes ya pagado y después pasas al plan gratis sin perder tus datos.</li>
        <li>Si un cobro falla, te avisaremos y se reintentará durante unos días. Si no se puede cobrar, la cuenta pasará al plan gratis.</li>
        <li>Si cambiamos el precio, te avisaremos por correo al menos 30 días antes. Si no estás de acuerdo, puedes cancelar antes de que se aplique.</li>
        <li>Recibirás la factura de cada pago por correo y podrás descargarlas desde «Gestionar mi suscripción».</li>
      </ul>

      <h2>5. Derecho de desistimiento</h2>
      <p>
        Si contratas como consumidor, tienes {DESISTIMIENTO_DIAS} días naturales desde la contratación de Premium para desistir sin dar explicaciones. Para hacerlo,
        escríbenos a <ContactEmail /> indicando tu decisión. Te devolveremos el importe pagado, por el mismo medio de pago, en un plazo máximo de 14 días.
      </p>

      <h2>6. Uso aceptable</h2>
      <p>Te comprometes a:</p>
      <ul>
        <li><strong>Escribir solo a personas que te hayan dado su permiso.</strong> Está prohibido enviar spam, usar listas compradas o alquiladas y añadir correos sin consentimiento.</li>
        <li>No enviar contenido ilegal, engañoso, ofensivo, que suplante a otros o que infrinja derechos de terceros.</li>
        <li>Identificarte como remitente y respetar las bajas (el servicio las gestiona por ti).</li>
        <li>No intentar saltarte los límites, atacar el servicio ni usarlo para fines distintos a enviar tu newsletter.</li>
      </ul>
      <p>Si incumples estas normas (por ejemplo, con muchas quejas de spam o rebotes), podemos suspender los envíos o la cuenta, avisándote cuando sea posible.</p>

      <h2>7. Tu contenido y la inteligencia artificial</h2>
      <p>
        Lo que escribes y lo que se genera para ti es tuyo, y eres responsable de lo que envías. La IA puede equivocarse: <strong>revisa cada newsletter antes de
        enviarla</strong>. Nos das permiso para tratar tu contenido solo en la medida necesaria para prestarte el servicio.
      </p>

      <h2>8. Datos personales</h2>
      <p>
        Tratamos tus datos según la <a href="/privacidad" className="underline">Política de privacidad</a>. Respecto a los datos de tus suscriptores, tú eres el
        responsable y {BRAND} tu encargado del tratamiento, según el <a href="/encargo-tratamiento" className="underline">Contrato de encargo del tratamiento</a>,
        que forma parte de estas condiciones.
      </p>

      <h2>9. Disponibilidad y responsabilidad</h2>
      <p>
        Hacemos lo posible para que el servicio esté siempre disponible, pero puede haber interrupciones por mantenimiento o fallos de proveedores. Salvo dolo o
        negligencia grave, nuestra responsabilidad se limita al importe que hayas pagado en los últimos 12 meses. Nada de lo anterior limita tus derechos como
        consumidor.
      </p>

      <h2>10. Baja y cierre de la cuenta</h2>
      <p>Puedes borrar tu cuenta en cualquier momento desde Ajustes; si tienes Premium, cancélalo antes para que no se renueve. Podemos cerrar cuentas que incumplan estas condiciones.</p>

      <h2>11. Cambios en estas condiciones</h2>
      <p>Si las cambiamos de forma importante, te avisaremos con antelación. Si no estás de acuerdo, puedes dejar de usar el servicio y cancelar Premium.</p>

      <h2>12. Ley y tribunales</h2>
      <p>Se aplica la ley española. Si eres consumidor, podrás reclamar ante los tribunales de tu domicilio y acudir a los servicios de consumo de tu comunidad autónoma.</p>
    </Legal>
  );
}
