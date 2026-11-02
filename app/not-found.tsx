import Link from "next/link";
import Animal from "@/components/Animal";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
      <Animal id="buho" size={96} />
      <h1 className="mt-4 text-3xl font-bold">Aquí no hay nada</h1>
      <p className="mt-2 text-muted">Atlas ha buscado por todas partes y esta página no existe.</p>
      <Link href="/" className="btn btn-primary mt-6">Ir a la portada</Link>
    </main>
  );
}
