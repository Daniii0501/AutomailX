import Animal from "@/components/Animal";
import Brand from "@/components/Brand";
import EnterButton from "@/components/EnterButton";

export const metadata = { title: "Entrar · AutoMailX" };

export default async function Enter({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12 text-center">
      <div className="mb-10"><Brand /></div>
      <div className="card p-8">
        <Animal id="zorro" size={96} className="mx-auto" />
        <h1 className="mt-5 text-3xl font-bold">¡Ya casi estás dentro!</h1>
        <p className="mb-6 mt-2 text-muted">Pulsa el botón para entrar en tu cuenta.</p>
        <EnterButton token={typeof token === "string" ? token : ""} />
      </div>
    </main>
  );
}
