import { eq, one, update } from "@/lib/db";
import { sendMail } from "@/lib/email";
import { baseUrl, open, readBody, sameOrigin } from "@/lib/http";
import { clientIp, hit } from "@/lib/rate";
import { addSubscribers, confirmMail } from "@/lib/subscribers";
import { clean, isEmail, normEmail } from "@/lib/util";

/** Formulario público de /s/[slug]. Siempre doble confirmación. */
export const POST = open(async (req) => {
  const b = await readBody(req);
  const slug = clean(b.slug, 60);
  const back = (q: string) => Response.redirect(`${baseUrl(req)}/s/${encodeURIComponent(slug)}?${q}`, 303);
  if (!sameOrigin(req)) return back("error=origen");
  if (clean(b.website, 200)) return back("ok=1"); // trampa para bots
  const email = normEmail(b.email);
  if (!isEmail(email)) return back("error=correo");
  if (!(await hit(`sub-ip:${clientIp(req)}`, 20))) return back("error=limite");

  const pub = await one<{ user_id: string; name: string }>("publications", { select: "user_id,name", slug: eq(slug) });
  if (!pub) return back("error=noexiste");

  const existing = await one<{ status: string; token: string }>("subscribers", { select: "status,token", user_id: eq(pub.user_id), email: eq(email) });
  if (existing) {
    if (existing.status !== "confirmed") {
      // Quien se dio de baja o no confirmó puede volver: se le pide confirmar otra vez.
      await update("subscribers", { user_id: eq(pub.user_id), email: eq(email) }, { status: "pending" });
      await sendMail(confirmMail(email, existing.token, pub.name, baseUrl(req)));
    }
    return back("ok=1");
  }
  const r = await addSubscribers(pub.user_id, [email], { consent: false, source: "form", name: clean(b.name, 80), base: baseUrl(req) });
  if (r.error) return back("error=lleno");
  return back("ok=1");
});
