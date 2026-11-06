import { eq, neq, update } from "@/lib/db";
import { baseUrl, open, readBody } from "@/lib/http";
import { clean, isUuid } from "@/lib/util";

/**
 * Baja. Dos usos:
 *  - botón de /u/[token] (formulario) -> vuelve a la página;
 *  - "baja en un clic" de Gmail/Outlook (POST a ?token=...&n=... con List-Unsubscribe=One-Click) -> 200.
 * `n` es la campaña desde la que se dio de baja (para las estadísticas).
 */
export const POST = open(async (req) => {
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("token");
  const body = fromQuery ? {} : await readBody(req);
  const token = clean(fromQuery ?? body.token, 100);
  const n = url.searchParams.get("n") ?? body.n;
  if (token) {
    await update(
      "subscribers",
      { token: eq(token), status: neq("unsubscribed") },
      { status: "unsubscribed", unsubscribed_at: new Date().toISOString(), ...(isUuid(n) ? { unsubscribed_from: n } : {}) },
    );
  }
  if (fromQuery) return new Response("ok", { status: 200 });
  return Response.redirect(`${baseUrl(req)}/u/${encodeURIComponent(token)}?ok=1`, 303);
});
