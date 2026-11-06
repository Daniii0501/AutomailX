import Centered from "@/components/Centered";

export const metadata = { title: "Darse de baja", robots: { index: false } };

type P = Promise<{ token: string }>;
type SP = Promise<{ ok?: string; n?: string }>;

export default async function UnsubscribePage({ params, searchParams }: { params: P; searchParams: SP }) {
  const { token } = await params;
  const { ok, n } = await searchParams;
  const preview = token === "vista-previa";
  return (
    <Centered>
      <div className="text-center">
        {ok ? (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f2ef] text-2xl" aria-hidden>👋</div>
            <h1 className="text-2xl font-bold">Te has dado de baja</h1>
            <p className="mt-2 text-muted">No volverás a recibir esta newsletter. Sentimos verte marchar.</p>
          </>
        ) : preview ? (
          <>
            <h1 className="text-2xl font-bold">Enlace de baja</h1>
            <p className="mt-2 text-muted">Esto es una prueba: en el correo real, aquí tus lectores se dan de baja con un clic.</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">¿Darte de baja?</h1>
            <p className="mt-2 text-muted">Dejarás de recibir esta newsletter.</p>
            <form method="post" action="/api/public/unsubscribe" className="mt-6">
              <input type="hidden" name="token" value={token} />
              {n && <input type="hidden" name="n" value={n} />}
              <button type="submit" className="btn btn-primary w-full">Sí, darme de baja</button>
            </form>
          </>
        )}
      </div>
    </Centered>
  );
}
