import { eq, update } from "@/lib/db";
import { baseUrl, open, readBody } from "@/lib/http";
import { clean } from "@/lib/util";

/**
 * Baja. Dos usos:
 *  - botón de /u/[token] (formulario) -> vuelve a la página;
 *  - "baja en un clic" de Gmail/Outlook (POST a ?token=... con List-Unsubscribe=One-Click) -> 200.
 */
export const POST = open(async (req) => {
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("token");
  const token = clean(fromQuery ?? (await readBody(req)).token, 100);
  if (token) await update("subscribers", { token: eq(token) }, { status: "unsubscribed" });
  if (fromQuery) return new Response("ok", { status: 200 });
  return Response.redirect(`${baseUrl(req)}/u/${encodeURIComponent(token)}?ok=1`, 303);
});
