import Link from "next/link";
import { notFound } from "next/navigation";
import WriterAvatar from "@/components/WriterAvatar";
import SubscribeForm from "@/components/SubscribeForm";
import { isAnimal } from "@/lib/animals";
import { lookOf } from "@/lib/look";
import { dbConfigured, q1 } from "@/lib/db";

export default async function PublicSubscribe({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!dbConfigured) notFound();
  const pub = await q1<{ user_id: string; name: string; sender_name: string }>(
    "SELECT user_id, name, sender_name FROM publications WHERE slug = ?",
    [slug],
  );
  if (!pub) notFound();
  const w = await q1<{ kind: string; animal: string; name: string; avatar: string; color: string }>(
    "SELECT kind, animal, name, avatar, color FROM writers WHERE user_id = ? ORDER BY created_at LIMIT 1",
    [pub.user_id],
  );
  const face = {
    kind: (w?.kind === "custom" ? "custom" : "animal") as "animal" | "custom",
    animal: w && isAnimal(w.animal) ? w.animal : ("zorro" as const),
    avatar: w?.avatar ?? "",
    color: w?.color ?? "",
  };
  const look = lookOf(face);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="card p-8" style={{ background: `linear-gradient(160deg, ${look.soft}, #fff 55%)` }}>
        <WriterAvatar w={face} size={96} className="mx-auto" />
        <h1 className="mt-5 text-center text-3xl font-bold">{pub.name}</h1>
        <p className="mb-7 mt-2 text-center text-muted">Recibe cada newsletter en tu correo, escrita por {pub.sender_name}.</p>
        <SubscribeForm slug={slug} color={look.color} />
      </div>
      <p className="mt-6 text-center text-xs text-muted">
        Hecho con <Link href="/" className="underline">AutoMailX</Link>
      </p>
    </main>
  );
}
