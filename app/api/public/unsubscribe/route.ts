import { run } from "@/lib/db";
import { json } from "@/lib/util";

/**
 * Baja de un suscriptor. Admite la baja con un clic de los clientes de correo
 * (POST con el token en la URL) y la de nuestra página (POST con JSON).
 * No exige cabecera Origin a propósito: el token es el secreto.
 */
export async function POST(req: Request) {
  let token = new URL(req.url).searchParams.get("token") ?? "";
  if (!token) {
    try {
      const b = (await req.json()) as { token?: string };
      token = String(b.token ?? "");
    } catch {
      token = "";
    }
  }
  if (!token) return json({ error: "Enlace no válido." }, 400);
  await run("UPDATE subscribers SET status = 'unsubscribed' WHERE token = ?", [token]);
  return json({ ok: true });
}
