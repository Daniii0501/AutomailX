import Link from "next/link";
import Animal from "@/components/Animal";
import ConfirmButton from "@/components/ConfirmButton";
import { q1 } from "@/lib/db";

export const metadata = { title: "Confirmar suscripción" };

export default async function Confirm({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sub = await q1<{ status: string; user_id: string }>("SELECT status, user_id FROM subscribers WHERE token = ?", [token]);
  const pub = sub ? await q1<{ name: string }>("SELECT name FROM publications WHERE user_id = ?", [sub.user_id]) : null;
  const valid = !!sub && sub.status !== "unsubscribed";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12 text-center">
      <div className="card p-8">
        <Animal id={valid ? "oso" : "gato"} size={90} className="mx-auto" />
        {valid ? (
          <>
            <h1 className="mt-5 text-2xl font-bold">Un último paso</h1>
            <p className="mb-6 mt-2 text-muted">Confirma que quieres recibir {pub?.name ?? "esta newsletter"}.</p>
            {sub?.status === "confirmed" ? (
              <p className="rounded-xl bg-ok/10 px-4 py-3 font-medium text-ok">Ya estabas confirmado. ¡Gracias!</p>
            ) : (
              <ConfirmButton token={token} publication={pub?.name ?? "la lista"} />
            )}
          </>
        ) : (
          <>
            <h1 className="mt-5 text-2xl font-bold">Enlace no válido</h1>
            <p className="mt-2 text-muted">Este enlace no existe o ya no está activo. Si te habías dado de baja, vuelve a suscribirte desde el formulario.</p>
          </>
        )}
        <Link href="/" className="mt-6 inline-block text-sm text-muted underline">AutoMailX</Link>
      </div>
    </main>
  );
}
