import Legal, { ContactEmail, Owner } from "@/components/Legal";
import { BRAND, PROVIDERS } from "@/lib/legal";

export const metadata = { title: "Encargo del tratamiento · AutoMailX" };

export default function EncargoTratamiento() {
  return (
    <Legal
      title="Contrato de encargo del tratamiento"
      intro={`Cuando usas ${BRAND} para escribir a tus suscriptores, tú decides qué datos tratas y para qué (eres el responsable) y ${BRAND} los trata por tu cuenta (es tu encargado). Este contrato, exigido por el artículo 28 del RGPD, regula esa relación. Se acepta al crear la cuenta y forma parte de los Términos y condiciones.`}
    >
      <h2>1. Partes</h2>
      <ul>
        <li><strong>Responsable:</strong> el usuario de {BRAND} titular de la cuenta.</li>
        <li><strong>Encargado:</strong> <Owner field="name" />, NIF <Owner field="nif" />, domicilio en <Owner field="address" />, contacto <ContactEmail />.</li>
      </ul>

      <h2>2. Objeto, duración y finalidad</h2>
      <p>
        El encargado tratará los datos de los suscriptores del responsable solo para prestarle el servicio de {BRAND}: guardar su lista, gestionar las altas
        (con doble confirmación) y las bajas, enviar sus newsletters y mostrarle métricas de entrega, aperturas y clics. El encargo dura mientras el responsable
        mantenga su cuenta.
      </p>

      <h2>3. Datos y personas afectadas</h2>
      <ul>
        <li><strong>Personas:</strong> suscriptores de la newsletter del responsable.</li>
        <li><strong>Datos:</strong> correo electrónico, nombre (si lo facilitan), estado de la suscripción, fechas de alta, confirmación y baja, y datos de interacción con los correos (entregas, aperturas, clics, rebotes y quejas).</li>
        <li>No se tratan categorías especiales de datos.</li>
      </ul>

      <h2>4. Obligaciones del encargado</h2>
      <ol>
        <li>Tratar los datos solo siguiendo las instrucciones del responsable, que son las que da al usar el servicio.</li>
        <li>Garantizar que las personas autorizadas a tratarlos se han comprometido a la confidencialidad.</li>
        <li>Aplicar medidas de seguridad adecuadas: cifrado en tránsito, acceso restringido a la base de datos, autenticación sin contraseñas y proveedores con certificaciones reconocidas.</li>
        <li>Ayudar al responsable a atender los derechos de los suscriptores (acceso, rectificación, supresión, oposición, limitación y portabilidad). El servicio permite ver, exportar y borrar suscriptores, y las bajas son automáticas.</li>
        <li>Notificar al responsable, sin dilación indebida, cualquier brecha de seguridad que afecte a sus datos, con la información disponible.</li>
        <li>Al terminar el servicio (si el responsable borra su cuenta), suprimir los datos de sus suscriptores. Antes, el responsable puede descargarlos desde Ajustes.</li>
        <li>Poner a disposición del responsable la información necesaria para demostrar el cumplimiento de este contrato.</li>
      </ol>

      <h2>5. Subencargados</h2>
      <p>El responsable autoriza al encargado a recurrir a estos proveedores, con los que tiene firmados contratos con garantías equivalentes:</p>
      <ul>
        {PROVIDERS.map((p) => (
          <li key={p.name}><strong>{p.name}</strong>: {p.what} ({p.where}).</li>
        ))}
      </ul>
      <p>
        Las transferencias fuera del Espacio Económico Europeo se amparan en el Marco de Privacidad de Datos UE-EE. UU. o en las cláusulas contractuales tipo de
        la Comisión Europea. El encargado informará de cualquier cambio de subencargados con antelación para que el responsable pueda oponerse.
      </p>

      <h2>6. Obligaciones del responsable</h2>
      <ul>
        <li>Tener una base legal para tratar los datos de sus suscriptores (normalmente, su consentimiento) y no incluir a nadie sin ella.</li>
        <li>Informar a sus suscriptores sobre el tratamiento de sus datos.</li>
        <li>Cumplir la normativa de comunicaciones comerciales (LSSI): identificarse como remitente y respetar las bajas.</li>
      </ul>
    </Legal>
  );
}
