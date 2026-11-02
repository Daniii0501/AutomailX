import { headers } from "next/headers";
import AudienceManager from "@/components/AudienceManager";
import { requireUser } from "@/lib/auth";
import { getPublication } from "@/lib/data";
import { eq, select } from "@/lib/db";
import { mailEnabled } from "@/lib/email";
import { FREE } from "@/lib/plans";
import type { Subscriber } from "@/lib/subscribers";

export default async function AudiencePage() {
  const user = await requireUser();
  const [pub, subs, h] = await Promise.all([
    getPublication(user.id),
    select<Subscriber>("subscribers", { select: "id,email,name,status,source,created_at", user_id: eq(user.id), order: "created_at.desc", limit: 1000 }),
    headers(),
  ]);
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const site = process.env.APP_URL || `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
  return (
    <div>
      <h1 className="text-3xl font-bold">Audiencia</h1>
      <p className="mt-1 mb-6 text-muted">Las personas que reciben {pub.name}. Solo los confirmados reciben tus envíos.</p>
      <AudienceManager subs={subs} publicUrl={`${site}/s/${pub.slug}`} limit={FREE.subscribers} mailOn={mailEnabled()} />
    </div>
  );
}
