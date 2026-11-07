import { notFound } from "next/navigation";
import Centered from "@/components/Centered";
import { eq, one } from "@/lib/db";

type P = Promise<{ slug: string }>;
type SP = Promise<{ ok?: string; error?: string }>;

const ERRORS: Record<string, string> = {
  correo: "Ese correo no parece válido.",
  limite: "Demasiados intentos desde aquí. Prueba más tarde.",
  lleno: "Esta newsletter no admite más suscriptores ahora mismo.",
  origen: "No se pudo enviar el formulario. Recarga la página.",
  noexiste: "Esta newsletter ya no existe.",
};

export async function generateMetadata({ params }: { params: P }) {
  const { slug } = await params;
  const pub = await one<{ name: string }>("publications", { select: "name", slug: eq(slug) }).catch(() => null);
  return { title: pub ? `Suscríbete a ${pub.name}` : "Suscripción" };
}

export default async function SubscribePage({ params, searchParams }: { params: P; searchParams: SP }) {
  const { slug } = await params;
  const { ok, error } = await searchParams;
  const pub = await one<{ name: string; sender_name: string; reply_to: string | null }>("publications", { select: "name,sender_name,reply_to", slug: eq(slug) });
  if (!pub) notFound();

  return (
    <Centered footer={<span>Hecho con AutoMailX</span>}>
      {ok ? (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e9f7f0] text-2xl" aria-hidden>✅</div>
          <h1 className="text-2xl font-bold">Revisa tu correo</h1>
          <p className="mt-2 text-muted">Te hemos enviado un correo para confirmar la suscripción. Hasta que no lo confirmes, no recibirás nada.</p>
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold text-muted">Newsletter de {pub.sender_name}</p>
          <h1 className="mt-1 text-2xl font-bold">{pub.name}</h1>
          <p className="mt-2 text-muted">Apúntate y te llegará al correo. Puedes darte de baja cuando quieras con un clic.</p>
          {error && <p role="alert" className="banner banner-err mt-5">{ERRORS[error] ?? "Algo ha fallado. Inténtalo otra vez."}</p>}
          <form method="post" action="/api/public/subscribe" className="mt-6 space-y-3">
            <input type="hidden" name="slug" value={slug} />
            <div className="hidden" aria-hidden>
              <label>No rellenar <input name="website" tabIndex={-1} autoComplete="off" /></label>
            </div>
            <div>
              <label htmlFor="name" className="label">Tu nombre <span className="font-normal text-muted">(opcional)</span></label>
              <input id="name" name="name" autoComplete="given-name" className="input" />
            </div>
            <div>
              <label htmlFor="email" className="label">Tu correo</label>
              <input id="email" name="email" type="email" required autoComplete="email" inputMode="email" placeholder="tu@correo.com" className="input" />
            </div>
            <button type="submit" className="btn btn-primary w-full">Suscribirme</button>
          </form>
          <p className="hint mt-4">
            <strong>Protección de datos.</strong> Responsable: {pub.sender_name}{pub.reply_to ? ` (${pub.reply_to})` : ""}. Finalidad: enviarte esta newsletter.
            Base legal: tu consentimiento, que confirmas por correo. Los datos los guarda y envía AutoMailX por encargo suyo. Puedes darte de baja en cualquier
            correo y ejercer tus derechos escribiendo a quien te envía la newsletter. Más información en la{" "}
            <a href="/privacidad#suscriptores" className="underline">política de privacidad</a>.
          </p>
        </>
      )}
    </Centered>
  );
}
