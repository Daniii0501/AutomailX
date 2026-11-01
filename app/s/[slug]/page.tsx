import Link from "next/link";
import { notFound } from "next/navigation";
import Animal from "@/components/Animal";
import SubscribeForm from "@/components/SubscribeForm";
import { ANIMALS, isAnimal } from "@/lib/animals";
import { q1 } from "@/lib/db";

export default async function PublicSubscribe({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pub = await q1<{ user_id: string; name: string; sender_name: string }>(
    "SELECT user_id, name, sender_name FROM publications WHERE slug = ?",
    [slug],
  );
  if (!pub) notFound();
  const w = await q1<{ animal: string; name: string }>(
    "SELECT animal, name FROM writers WHERE user_id = ? ORDER BY created_at LIMIT 1",
    [pub.user_id],
  );
  const animal = w && isAnimal(w.animal) ? w.animal : "zorro";
  const a = ANIMALS[animal];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="card p-8" style={{ background: `linear-gradient(160deg, ${a.soft}, #fff 55%)` }}>
        <Animal id={animal} size={96} className="mx-auto" />
        <h1 className="mt-5 text-center text-3xl font-bold">{pub.name}</h1>
        <p className="mb-7 mt-2 text-center text-muted">Recibe cada newsletter en tu correo, escrita por {pub.sender_name}.</p>
        <SubscribeForm slug={slug} color={a.color} />
      </div>
      <p className="mt-6 text-center text-xs text-muted">
        Hecho con <Link href="/" className="underline">AutoMailX</Link>
      </p>
    </main>
  );
}
