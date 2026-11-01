import Link from "next/link";
import Animal from "@/components/Animal";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <Animal id="gato" size={110} />
      <h1 className="mt-6 text-3xl font-bold">No encuentro esta página</h1>
      <p className="mt-2 text-muted">Puede que el enlace esté mal o que ya no exista.</p>
      <Link href="/" className="btn btn-primary mt-8">Ir al inicio</Link>
    </main>
  );
}
