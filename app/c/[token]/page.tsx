import Centered from "@/components/Centered";

export const metadata = { title: "Confirmar suscripción", robots: { index: false } };

type P = Promise<{ token: string }>;
type SP = Promise<{ ok?: string; error?: string }>;

export default async function ConfirmPage({ params, searchParams }: { params: P; searchParams: SP }) {
  const { token } = await params;
  const { ok, error } = await searchParams;
  return (
    <Centered>
      <div className="text-center">
        {ok ? (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e9f7f0] text-2xl" aria-hidden>🎉</div>
            <h1 className="text-2xl font-bold">¡Suscripción confirmada!</h1>
            <p className="mt-2 text-muted">Ya estás en la lista. La próxima newsletter te llegará al correo.</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Confirma tu suscripción</h1>
            {error ? (
              <p className="banner banner-warn mt-4">Este enlace ya se usó o no es válido. Si ya confirmaste, no tienes que hacer nada más.</p>
            ) : (
              <p className="mt-2 text-muted">Pulsa el botón para empezar a recibir la newsletter.</p>
            )}
            <form method="post" action="/api/public/confirm" className="mt-6">
              <input type="hidden" name="token" value={token} />
              <button type="submit" className="btn btn-primary w-full">Sí, quiero recibirla</button>
            </form>
          </>
        )}
      </div>
    </Centered>
  );
}
