import Link from "next/link";
import { redirect } from "next/navigation";
import Centered from "@/components/Centered";
import { getUser } from "@/lib/auth";
import { dbConfigured } from "@/lib/db";

export const metadata = { title: "Entrar · AutoMailX" };

type SP = Promise<{ error?: string; enviado?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SP }) {
  const { error, enviado } = await searchParams;
  const db = dbConfigured();
  if (db && (await getUser().catch(() => null))) redirect("/panel");

  return (
    <Centered footer={<Link href="/" className="underline underline-offset-4">Volver a la portada</Link>}>
      {enviado ? (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f1edff] text-2xl" aria-hidden>📬</div>
          <h1 className="text-2xl font-bold">Mira tu correo</h1>
          <p className="mt-2 text-muted">
            Te hemos mandado un enlace a <strong className="text-ink">{enviado}</strong>. Ábrelo desde este mismo dispositivo. Caduca en 15 minutos.
          </p>
          <p className="hint mt-5">¿No llega? Mira en «Spam» o «Promociones», o <Link className="underline" href="/login">pide otro</Link>.</p>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Entra en AutoMailX</h1>
          <p className="mt-1.5 text-muted">Sin contraseñas: te mandamos un enlace a tu correo.</p>
          {error && <p role="alert" className="banner banner-err mt-5">{error}</p>}
          {!db && <p className="banner banner-warn mt-5">La base de datos aún no está conectada, así que todavía no se puede entrar.</p>}
          <form method="post" action="/api/auth/request" className="mt-6 space-y-3">
            <label htmlFor="email" className="label">Tu correo</label>
            <input id="email" name="email" type="email" required autoComplete="email" inputMode="email" placeholder="tu@correo.com" className="input" />
            <button type="submit" className="btn btn-primary w-full" disabled={!db}>Continuar</button>
          </form>
          <p className="hint mt-5">Si es tu primera vez, se crea tu cuenta al entrar. Es gratis.</p>
          <p className="hint mt-2">
            Al continuar aceptas los <Link href="/terminos" className="underline">Términos</Link> (incluido el{" "}
            <Link href="/encargo-tratamiento" className="underline">encargo del tratamiento</Link>) y la{" "}
            <Link href="/privacidad" className="underline">Política de privacidad</Link>.
          </p>
        </>
      )}
    </Centered>
  );
}
