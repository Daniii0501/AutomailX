import { createLoginToken, demoLogin } from "@/lib/auth";
import { dbConfigured } from "@/lib/db";
import { mailEnabled, sendMail, simpleMail, usingTestSender } from "@/lib/email";
import { baseUrl, fail, json, open, readBody, sameOrigin } from "@/lib/http";
import { clientIp, hit } from "@/lib/rate";

/**
 * Pide un enlace de acceso. Sirve tanto para el formulario HTML (sin JavaScript) como para fetch.
 * Respuesta: JSON si se pidió JSON; si no, redirección a /login con el resultado.
 */
export const POST = open(async (req) => {
  const wantsJson = (req.headers.get("accept") ?? "").includes("application/json");
  const answer = (data: { ok: boolean; error?: string; link?: string; email?: string }, status = 200) => {
    if (wantsJson) return json(data, status);
    const u = new URL("/login", baseUrl(req));
    if (data.error) u.searchParams.set("error", data.error);
    if (data.link) return Response.redirect(data.link, 303);
    if (data.ok && data.email) u.searchParams.set("enviado", data.email);
    return Response.redirect(u, 303);
  };

  if (!sameOrigin(req)) return fail("Petición no permitida.", 403);
  if (!dbConfigured()) return answer({ ok: false, error: "La base de datos no está conectada todavía." }, 503);
  if (!(await hit(`login-ip:${clientIp(req)}`, 30))) return answer({ ok: false, error: "Demasiados intentos. Prueba más tarde." }, 429);

  const b = await readBody(req);
  const r = await createLoginToken(b.email);
  if (r === "invalid") return answer({ ok: false, error: "Ese correo no parece válido. Revísalo." }, 400);
  if (r === "limit") return answer({ ok: false, error: "Ya te hemos mandado varios enlaces. Mira tu correo o espera una hora." }, 429);

  const link = `${baseUrl(req)}/entrar?t=${encodeURIComponent(r.token)}`;

  if (demoLogin()) return answer({ ok: true, link, email: r.email });

  if (!mailEnabled()) return answer({ ok: false, error: "El envío de correos no está configurado todavía (falta RESEND_API_KEY)." }, 503);
  const m = simpleMail({
    heading: "Tu enlace para entrar",
    body: "Pulsa el botón para entrar en AutoMailX. El enlace caduca en 15 minutos y solo sirve una vez.",
    buttonText: "Entrar en AutoMailX",
    buttonUrl: link,
  });
  const sent = await sendMail({ to: r.email, subject: "Tu enlace para entrar en AutoMailX", ...m });
  if (!sent.ok) {
    const hint = usingTestSender() ? " Con el remitente de pruebas de Resend solo puedes entrar con el correo de tu cuenta de Resend." : "";
    return answer({ ok: false, error: `No pudimos enviarte el correo. ${sent.error ?? ""}${hint}`.trim() }, 502);
  }
  return answer({ ok: true, email: r.email });
});
