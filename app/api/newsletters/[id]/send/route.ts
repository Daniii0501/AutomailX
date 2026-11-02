import { authed, baseUrl, fail, json, readBody } from "@/lib/http";
import { deliverNewsletter, sendTest } from "@/lib/send";

export const maxDuration = 120;

type P = { id: string };

/** { test: true } -> prueba a tu correo. Si no, envío real a la lista. */
export const POST = authed<P>(async (req, user, { id }) => {
  const b = await readBody(req);
  const base = baseUrl(req);
  const r = b.test === true ? await sendTest(user, id, base) : await deliverNewsletter(user, id, base);
  if (!r.ok) return fail(r.error, r.status);
  return json(r);
});
