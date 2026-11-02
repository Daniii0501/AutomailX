import { eq, update } from "@/lib/db";
import { baseUrl, open, readBody } from "@/lib/http";
import { clean } from "@/lib/util";

/** Botón "Sí, quiero recibirla" de /c/[token]. */
export const POST = open(async (req) => {
  const token = clean((await readBody(req)).token, 100);
  const ok = token
    ? (await update("subscribers", { token: eq(token), status: eq("pending") }, { status: "confirmed", confirmed_at: new Date().toISOString() })).length > 0
    : false;
  return Response.redirect(`${baseUrl(req)}/c/${encodeURIComponent(token)}?${ok ? "ok=1" : "error=1"}`, 303);
});
