import { consumeLoginToken, sessionCookie } from "@/lib/auth";
import { baseUrl, fail, open, readBody, sameOrigin } from "@/lib/http";
import { clientIp, hit } from "@/lib/rate";

/** Canjea el enlace mágico. Solo por POST (botón), para que los antivirus del correo no lo gasten. */
export const POST = open(async (req) => {
  if (!sameOrigin(req)) return fail("Petición no permitida.", 403);
  const base = baseUrl(req);
  if (!(await hit(`verify-ip:${clientIp(req)}`, 60))) return Response.redirect(`${base}/login?error=${encodeURIComponent("Demasiados intentos. Prueba más tarde.")}`, 303);

  const b = await readBody(req);
  const t = typeof b.t === "string" ? b.t : "";
  const session = await consumeLoginToken(t);
  if (!session) {
    return Response.redirect(`${base}/login?error=${encodeURIComponent("Ese enlace ya no sirve (caduca a los 15 minutos y solo vale una vez). Pide otro.")}`, 303);
  }
  const c = sessionCookie(session);
  const cookie = `${c.name}=${c.value}; Path=${c.path}; Max-Age=${c.maxAge}; HttpOnly; SameSite=Lax${c.secure ? "; Secure" : ""}`;
  return new Response(null, { status: 303, headers: { location: `${base}/panel`, "set-cookie": cookie } });
});
