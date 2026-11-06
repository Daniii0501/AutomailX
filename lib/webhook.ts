import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Comprueba la firma de un aviso (webhook) de Resend. Resend firma con el estándar Svix:
 * cabeceras svix-id, svix-timestamp y svix-signature ("v1,<firma> v1,<firma>..."),
 * firma = HMAC-SHA256 en base64 de "<id>.<timestamp>.<cuerpo>" con el secreto "whsec_...".
 */
export function verifySvix(secret: string, headers: Headers, rawBody: string, nowMs = Date.now()): boolean {
  const id = headers.get("svix-id");
  const ts = headers.get("svix-timestamp");
  const sigs = headers.get("svix-signature");
  if (!id || !ts || !sigs || !secret) return false;
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum) || Math.abs(nowMs / 1000 - tsNum) > 5 * 60) return false; // avisos viejos o del futuro: fuera

  const key = Buffer.from(secret.startsWith("whsec_") ? secret.slice(6) : secret, "base64");
  const expected = createHmac("sha256", key).update(`${id}.${ts}.${rawBody}`).digest();
  for (const part of sigs.split(" ")) {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) continue;
    const got = Buffer.from(sig, "base64");
    if (got.length === expected.length && timingSafeEqual(got, expected)) return true;
  }
  return false;
}

export const webhookConfigured = () => !!process.env.RESEND_WEBHOOK_SECRET;
