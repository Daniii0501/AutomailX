import Animal from "@/components/Animal";
import UnsubscribeButton from "@/components/UnsubscribeButton";
import { q1 } from "@/lib/db";

export const metadata = { title: "Darme de baja" };

export default async function Unsubscribe({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sub = await q1<{ email: string; status: string; user_id: string }>(
    "SELECT email, status, user_id FROM subscribers WHERE token = ?",
    [token],
  );
  const pub = sub ? await q1<{ name: string }>("SELECT name FROM publications WHERE user_id = ?", [sub.user_id]) : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12 text-center">
      <div className="card p-8">
        <Animal id="oso" size={90} className="mx-auto" />
        {!sub ? (
          <>
            <h1 className="mt-5 text-2xl font-bold">Esto es una vista previa</h1>
            <p className="mt-2 text-muted">Este enlace de baja es de un correo de prueba, así que no hace nada.</p>
          </>
        ) : sub.status === "unsubscribed" ? (
          <>
            <h1 className="mt-5 text-2xl font-bold">Ya estabas dado de baja</h1>
            <p className="mt-2 text-muted">No recibirás más correos de {pub?.name ?? "esta newsletter"}.</p>
          </>
        ) : (
          <>
            <h1 className="mt-5 text-2xl font-bold">¿Quieres darte de baja?</h1>
            <p className="mb-6 mt-2 text-muted">Dejarás de recibir {pub?.name ?? "esta newsletter"} en <b className="text-ink">{sub.email}</b>.</p>
            <UnsubscribeButton token={token} />
          </>
        )}
      </div>
    </main>
  );
}
