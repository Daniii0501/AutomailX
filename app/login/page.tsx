import { redirect } from "next/navigation";
import Animal from "@/components/Animal";
import Brand from "@/components/Brand";
import LoginForm from "@/components/LoginForm";
import { ANIMAL_IDS } from "@/lib/animals";
import { getUser } from "@/lib/auth";
import { dbConfigured } from "@/lib/db";

export const metadata = { title: "Entrar · AutoMailX" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getUser()) redirect("/panel");
  const { error } = await searchParams;

  // Sin base de datos no se puede crear la cuenta ni guardar nada: lo decimos claro en vez de fallar callados.
  if (!dbConfigured) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
        <div className="mb-10 text-center"><Brand /></div>
        <div className="card p-8">
          <Animal id="gato" size={90} className="mx-auto" />
          <h1 className="mt-5 text-center text-2xl font-bold">Falta un último paso</h1>
          <p className="mt-2 text-center text-muted">
            Esta web todavía no tiene la base de datos conectada, así que no se puede crear ninguna cuenta.
          </p>
          <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm text-muted">
            <li>En Vercel, abre tu proyecto y entra en <b className="text-ink">Storage</b>.</li>
            <li>Crea o conecta una base de datos de <b className="text-ink">Supabase</b> en tu proyecto.</li>
            <li>Pulsa <b className="text-ink">Redeploy</b> en Deployments.</li>
          </ol>
          <p className="mt-5 text-center text-xs text-muted">Si eres tú quien administra la web, abre /api/health para ver el estado.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-10 text-center">
        <Brand />
      </div>
      <div className="card p-8">
        <div className="mb-6 flex justify-center -space-x-2" aria-hidden>
          {ANIMAL_IDS.map((id) => (
            <Animal key={id} id={id} size={44} className="rounded-full ring-2 ring-white" />
          ))}
        </div>
        <h1 className="text-center text-3xl font-bold">Hola 👋</h1>
        <p className="mb-7 mt-2 text-center text-muted">Escribe tu correo y entra. Si es tu primera vez, crearemos tu cuenta.</p>
        <LoginForm hadError={error === "1"} />
      </div>
    </main>
  );
}
