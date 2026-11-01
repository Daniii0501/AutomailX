import AudienceManager from "@/components/AudienceManager";
import { requireUser } from "@/lib/auth";
import { getPublication, listSubscribers } from "@/lib/data";
import { FREE } from "@/lib/plans";
import { baseUrl } from "@/lib/util";

export default async function AudiencePage() {
  const user = await requireUser();
  const [subs, pub, base] = await Promise.all([listSubscribers(user.id), getPublication(user.id), baseUrl()]);
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Audiencia</h1>
      <AudienceManager
        subs={subs.map((s) => ({ id: s.id, email: s.email, name: s.name, status: s.status, source: s.source, created_at: s.created_at }))}
        shareUrl={`${base}/s/${pub.slug}`}
        limit={FREE.subscribers}
      />
    </div>
  );
}
