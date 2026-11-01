import { redirect } from "next/navigation";
import Animal from "@/components/Animal";
import Brand from "@/components/Brand";
import LoginForm from "@/components/LoginForm";
import { ANIMAL_IDS } from "@/lib/animals";
import { getUser } from "@/lib/auth";

export const metadata = { title: "Entrar · AutoMailX" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getUser()) redirect("/panel");
  const { error } = await searchParams;

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
