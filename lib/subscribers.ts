import "server-only";
import { getPublication } from "./data";
import { count, eq, insert, neq } from "./db";
import { sendBatch, simpleMail, type Mail } from "./email";
import { FREE } from "./plans";
import { isEmail, newToken, normEmail } from "./util";

export type Subscriber = {
  id: string;
  email: string;
  name: string;
  status: "pending" | "confirmed" | "unsubscribed";
  token: string;
  source: string;
  created_at: string;
};

/** Saca todos los correos de un texto pegado (uno por línea, separados por comas, etc.). */
export function emailsIn(text: string): string[] {
  const found = text.match(/[^\s,;<>()"']+@[^\s,;<>()"']+\.[a-z]{2,}/gi) ?? [];
  return [...new Set(found.map(normEmail))].filter(isEmail);
}

export function confirmMail(to: string, token: string, publicationName: string, base: string): Mail {
  const m = simpleMail({
    heading: `Confirma tu suscripción a ${publicationName}`,
    body: "Solo falta un paso: confirma que quieres recibir esta newsletter. Si no te suena, ignora este correo y no recibirás nada.",
    buttonText: "Sí, quiero recibirla",
    buttonUrl: `${base}/c/${token}`,
    foot: "Te escribimos porque alguien apuntó este correo. Si no has sido tú, no hagas nada.",
  });
  return { to, subject: `Confirma tu suscripción a ${publicationName}`, ...m };
}

/** Añade correos a la lista de un usuario. Con `consent` quedan confirmados; si no, se les pide confirmación. */
export async function addSubscribers(
  userId: string,
  emails: string[],
  opts: { consent: boolean; source: string; name?: string; base: string },
): Promise<{ added: number; skipped: number; confirmationsSent: number; error?: string }> {
  const active = await count("subscribers", { user_id: eq(userId), status: neq("unsubscribed") });
  const room = FREE.subscribers - active;
  if (room <= 0) return { added: 0, skipped: emails.length, confirmationsSent: 0, error: `Has llegado al máximo de ${FREE.subscribers} suscriptores del plan gratis.` };
  const list = emails.slice(0, room);
  const rows = list.map((email) => ({
    user_id: userId,
    email,
    name: opts.name ?? "",
    status: opts.consent ? "confirmed" : "pending",
    token: newToken(24),
    source: opts.source,
    ...(opts.consent ? { confirmed_at: new Date().toISOString() } : {}),
  }));
  const inserted = rows.length ? await insert<{ email: string; token: string }>("subscribers", rows, { onConflict: "user_id,email", ignoreDuplicates: true }) : [];

  let confirmationsSent = 0;
  if (!opts.consent && inserted.length) {
    const pub = await getPublication(userId);
    const r = await sendBatch(inserted.map((s) => confirmMail(s.email, s.token, pub.name, opts.base)));
    confirmationsSent = r.sent;
  }
  return { added: inserted.length, skipped: emails.length - inserted.length, confirmationsSent };
}
