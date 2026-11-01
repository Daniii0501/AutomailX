import { createLoginToken, demoLogin } from "@/lib/auth";
import { body } from "@/lib/api";
import { mailEnabled, sendMail, simpleMail } from "@/lib/email";
import { hit } from "@/lib/rate";
import { baseUrl, ipHash, json, sameOrigin } from "@/lib/util";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Petición no permitida." }, 403);
  if (!(await hit(`login:${ipHash(req)}`, 25))) {
    return json({ error: "Demasiados intentos. Prueba mañana." }, 429);
  }

  const { email } = await body<{ email?: string }>(req);
  const token = await createLoginToken(typeof email === "string" ? email : "");
  if (token === "invalid") return json({ error: "Escribe un correo válido." }, 400);
  if (token === "limit") return json({ error: "Ya te hemos enviado varios enlaces. Espera un rato." }, 429);

  const link = `${await baseUrl()}/entrar?token=${token}`;

  if (demoLogin) return json({ ok: true, demo: true, link });

  if (!mailEnabled()) {
    return json({ error: "El envío de correo no está configurado todavía (falta RESEND_API_KEY)." }, 503);
  }
  const m = simpleMail({
    heading: "Tu enlace para entrar",
    body: "Pulsa el botón para entrar en AutoMailX. El enlace caduca en 15 minutos y solo funciona una vez.",
    buttonText: "Entrar en AutoMailX",
    buttonUrl: link,
  });
  const r = await sendMail({
    to: String(email).trim().toLowerCase(),
    subject: "Tu enlace para entrar en AutoMailX",
    ...m,
  });
  if (!r.ok) return json({ error: "No hemos podido enviar el correo. Inténtalo de nuevo." }, 502);
  return json({ ok: true });
}
