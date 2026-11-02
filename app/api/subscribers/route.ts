import { eq, select } from "@/lib/db";
import { authed, baseUrl, fail, json, readBody } from "@/lib/http";
import { addSubscribers, emailsIn, type Subscriber } from "@/lib/subscribers";
import { clean } from "@/lib/util";

export const GET = authed(async (_req, user) => {
  const subs = await select<Subscriber>("subscribers", { select: "id,email,name,status,source,created_at", user_id: eq(user.id), order: "created_at.desc", limit: 1000 });
  return json({ subscribers: subs });
});

/** Añade uno o varios correos (pegados). */
export const POST = authed(async (req, user) => {
  const b = await readBody(req);
  const emails = emailsIn(clean(b.emails, 50_000));
  if (!emails.length) return fail("No encuentro ningún correo válido en lo que has escrito.");
  const r = await addSubscribers(user.id, emails, { consent: b.consent === true, source: emails.length > 1 ? "import" : "manual", name: emails.length === 1 ? clean(b.name, 80) : "", base: baseUrl(req) });
  if (r.error && !r.added) return fail(r.error, 403);
  return json({ ok: true, ...r });
});
