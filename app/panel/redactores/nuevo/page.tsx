import Link from "next/link";
import WriterForm from "@/components/WriterForm";
import { isAnimal } from "@/lib/animals";
import { requireUser } from "@/lib/auth";
import { count, eq } from "@/lib/db";
import { FREE } from "@/lib/plans";

type SP = Promise<{ animal?: string; kind?: string }>;

export default async function NewWriterPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const { animal, kind } = await searchParams;
  const n = await count("writers", { user_id: eq(user.id) });
  if (n >= FREE.writers) {
    return (
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Tu equipo está completo</h1>
        <p className="mt-2 text-muted">En el plan gratis puedes tener {FREE.writers} redactores. Edita uno de los que ya tienes o despide a alguno.</p>
        <Link href="/panel" className="btn btn-primary mt-5">Volver</Link>
      </div>
    );
  }
  return (
    <div>
      <h1 className="mb-1 text-3xl font-bold">Contrata a tu redactor</h1>
      <p className="mb-6 text-muted">Dale personalidad. Podrás cambiarlo cuando quieras.</p>
      <WriterForm kind={kind === "custom" ? "custom" : "animal"} animal={isAnimal(animal) ? animal : "zorro"} />
    </div>
  );
}
