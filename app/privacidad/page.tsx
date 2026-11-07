import Legal, { ContactEmail, Owner } from "@/components/Legal";
import { BRAND, PROVIDERS } from "@/lib/legal";

export const metadata = { title: "Política de privacidad · AutoMailX" };

export default function Privacidad() {
  return (
    <Legal
      title="Política de privacidad"
      intro={`Aquí te explicamos, de forma clara, qué datos personales trata ${BRAND}, para qué, durante cuánto tiempo y qué derechos tienes, conforme al Reglamento (UE) 2016/679 (RGPD) y a la Ley Orgánica 3/2018 (LOPDGDD).`}
    >
      <h2>1. Quién es el responsable</h2>
      <ul>
        <li>Responsable: <Owner field="name" /> (NIF <Owner field="nif" />)</li>
        <li>Domicilio: <Owner field="address" /></li>
        <li>Contacto para privacidad: <ContactEmail /></li>
      </ul>
      <p>
        Ojo: si estás suscrito a la newsletter de un usuario de {BRAND}, el responsable de tus datos es esa persona o negocio (quien te escribe), y {BRAND} solo
        los trata por encargo suyo. Lo explicamos en el apartado 8.
      </p>

      <h2>2. Qué datos tratamos de nuestros usuarios</h2>
      <ul>
        <li><strong>Cuenta:</strong> tu correo electrónico.</li>
        <li><strong>Tu newsletter:</strong> el nombre de tu publicación, el nombre de remitente, el correo de respuesta, tus redactores, lo que les cuentas (notas, temas) y las newsletters que se generan.</li>
        <li><strong>Tu lista:</strong> los correos (y, si los das, los nombres) de tus suscriptores, y su estado.</li>
        <li><strong>Uso y métricas:</strong> entregas, aperturas, clics, rebotes y bajas de tus envíos.</li>
        <li><strong>Pago (Premium):</strong> el identificador de cliente y de suscripción en Stripe y el estado del pago. <strong>No vemos ni guardamos tu tarjeta</strong>: la gestiona Stripe.</li>
        <li><strong>Técnicos:</strong> la dirección IP de forma temporal para evitar abusos (límites de intentos) y una cookie de sesión.</li>
      </ul>

      <h2>3. Para qué y con qué base legal</h2>
      <ul>
        <li><strong>Darte el servicio</strong> (crear tu cuenta, redactar, enviar, mostrar métricas): ejecución del contrato (art. 6.1.b RGPD).</li>
        <li><strong>Cobrar Premium y emitir facturas</strong>: ejecución del contrato y cumplimiento de obligaciones legales fiscales (art. 6.1.b y 6.1.c).</li>
        <li><strong>Avisos del servicio</strong> (enlace de acceso, temas escritos, recordatorio semanal que tú activas, problemas de pago): ejecución del contrato.</li>
        <li><strong>Seguridad y prevención de abusos</strong> (límites, detección de spam): interés legítimo en proteger el servicio y a terceros (art. 6.1.f).</li>
      </ul>
      <p>No usamos tus datos para publicidad ni los vendemos. No tomamos decisiones automatizadas con efectos jurídicos sobre ti.</p>

      <h2>4. Inteligencia artificial</h2>
      <p>
        Para redactar, enviamos a nuestro proveedor de IA (OpenAI o Anthropic) lo que cuentas a tu redactor y su configuración. Según sus condiciones para empresas,
        no usan estos datos para entrenar sus modelos. Te recomendamos no incluir datos personales sensibles en tus notas.
      </p>

      <h2>5. Con quién compartimos datos</h2>
      <p>Solo con los proveedores necesarios para prestar el servicio, que actúan como encargados del tratamiento con contrato:</p>
      <ul>
        {PROVIDERS.map((p) => (
          <li key={p.name}><strong>{p.name}</strong>: {p.what} ({p.where}).</li>
        ))}
      </ul>
      <p>
        Cuando un proveedor está fuera del Espacio Económico Europeo, la transferencia se ampara en el Marco de Privacidad de Datos UE-EE. UU. o, en su defecto,
        en las cláusulas contractuales tipo aprobadas por la Comisión Europea. También podemos comunicar datos a autoridades cuando una ley lo exija.
      </p>

      <h2>6. Cuánto tiempo los guardamos</h2>
      <ul>
        <li>Mientras tengas la cuenta. Si la borras (en Ajustes), eliminamos al momento tu cuenta, tus redactores, tu lista y tus newsletters.</li>
        <li>Los datos de facturación, el tiempo que obliga la ley (hasta 6 años, por normativa mercantil y fiscal).</li>
        <li>Los enlaces de acceso caducan a los 15 minutos y las sesiones a los 30 días.</li>
      </ul>

      <h2>7. Tus derechos</h2>
      <p>
        Puedes pedir acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad de tus datos escribiendo a <ContactEmail />.
        Desde Ajustes puedes descargar todos tus datos y borrar tu cuenta tú mismo. Si crees que no hemos atendido bien tu petición, puedes reclamar ante la
        Agencia Española de Protección de Datos (<a href="https://www.aepd.es" className="underline" target="_blank" rel="noreferrer">www.aepd.es</a>).
      </p>

      <h2 id="suscriptores">8. Si eres suscriptor de una newsletter enviada con {BRAND}</h2>
      <p>
        Quien te escribe (el usuario de {BRAND}) es el responsable de tus datos y decide para qué los usa. {BRAND} actúa como encargado del tratamiento: guarda tu
        correo, te envía sus newsletters y registra entregas, aperturas, clics y bajas para mostrarle las métricas. Siempre necesitamos tu confirmación (doble
        opt-in) cuando te apuntas con su formulario, y cada correo lleva un enlace para darte de baja con un clic. Para ejercer tus derechos, escribe a quien te
        envía la newsletter (puedes responder a cualquiera de sus correos) o a <ContactEmail /> y se lo haremos llegar.
      </p>

      <h2>9. Seguridad</h2>
      <p>Usamos conexiones cifradas (HTTPS), contraseñas de un solo uso por correo en lugar de contraseñas guardadas, acceso a la base de datos restringido al servidor y proveedores con certificaciones de seguridad reconocidas.</p>

      <h2>10. Menores</h2>
      <p>{BRAND} está pensado para profesionales y negocios. No está dirigido a menores de 18 años.</p>

      <h2>11. Cambios</h2>
      <p>Si cambiamos esta política de forma importante, te avisaremos por correo o en la propia web.</p>
    </Legal>
  );
}
