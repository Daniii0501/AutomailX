import Legal, { ContactEmail, Owner } from "@/components/Legal";
import { BRAND, OWNER } from "@/lib/legal";

export const metadata = { title: "Aviso legal · AutoMailX" };

export default function AvisoLegal() {
  return (
    <Legal title="Aviso legal">
      <h2>1. Titular de la web</h2>
      <p>En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de que {BRAND} es un servicio de:</p>
      <ul>
        <li>Titular: <Owner field="name" /></li>
        <li>NIF: <Owner field="nif" /></li>
        <li>Domicilio: <Owner field="address" /></li>
        <li>Correo de contacto: <ContactEmail /></li>
        {OWNER.registry && <li>Datos registrales: {OWNER.registry}</li>}
      </ul>

      <h2>2. Objeto</h2>
      <p>{BRAND} es un servicio en línea que permite redactar con ayuda de inteligencia artificial, gestionar y enviar newsletters por correo electrónico. Las condiciones de uso y contratación están en los <a href="/terminos" className="underline">Términos y condiciones</a>.</p>

      <h2>3. Propiedad intelectual</h2>
      <p>El diseño, los textos, los personajes, los logotipos y el código de {BRAND} pertenecen a su titular o se usan con licencia. No pueden copiarse ni reutilizarse sin autorización. Los contenidos que cada usuario crea con el servicio son de ese usuario.</p>

      <h2>4. Responsabilidad</h2>
      <p>El titular trabaja para que la web funcione sin interrupciones ni errores, pero no puede garantizarlo en todo momento. No se hace responsable de los contenidos que los usuarios envían a sus propios suscriptores, que son responsabilidad exclusiva de quien los envía.</p>

      <h2>5. Enlaces</h2>
      <p>La web puede contener enlaces a sitios de terceros. El titular no controla esos sitios ni responde de su contenido.</p>

      <h2>6. Ley aplicable</h2>
      <p>Este aviso se rige por la ley española. Para cualquier controversia serán competentes los juzgados y tribunales que correspondan conforme a la ley; si eres consumidor, los de tu domicilio.</p>
    </Legal>
  );
}
