import Centered from "@/components/Centered";

export const metadata = { title: "Entrar · AutoMailX", robots: { index: false } };

type SP = Promise<{ t?: string }>;

/** El enlace del correo trae aquí. Se entra pulsando el botón (POST), no al abrir la página. */
export default async function EnterPage({ searchParams }: { searchParams: SP }) {
  const { t = "" } = await searchParams;
  return (
    <Centered>
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f1edff] text-2xl" aria-hidden>👋</div>
        <h1 className="text-2xl font-bold">¡Ya casi estás!</h1>
        <p className="mt-2 text-muted">Pulsa el botón para entrar en tu cuenta.</p>
        <form method="post" action="/api/auth/verify" className="mt-6">
          <input type="hidden" name="t" value={t} />
          <button type="submit" className="btn btn-primary w-full" autoFocus>Entrar en AutoMailX</button>
        </form>
      </div>
    </Centered>
  );
}
