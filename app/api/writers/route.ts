import { parseWriter } from "@/lib/data";
import { count, eq, insert } from "@/lib/db";
import { authed, fail, json, readBody } from "@/lib/http";
import { FREE } from "@/lib/plans";

export const POST = authed(async (req, user) => {
  const n = await count("writers", { user_id: eq(user.id) });
  if (n >= FREE.writers) return fail(`En el plan gratis puedes tener ${FREE.writers} redactores. Edita uno de los que ya tienes.`, 403);
  const w = parseWriter(await readBody(req));
  if (typeof w === "string") return fail(w);
  const [row] = await insert<{ id: string }>("writers", { ...w, user_id: user.id });
  return json({ ok: true, id: row.id });
});
