import { COOKIE } from "@/lib/auth";
import { eq, one, remove, select } from "@/lib/db";
import { authed } from "@/lib/http";

/** Descarga de todos tus datos (JSON). */
export const GET = authed(async (_req, user) => {
  const [publication, writers, subscribers, newsletters, topics] = await Promise.all([
    one("publications", { user_id: eq(user.id) }),
    select("writers", { user_id: eq(user.id) }),
    select("subscribers", { select: "email,name,status,source,created_at,confirmed_at", user_id: eq(user.id) }),
    select("newsletters", { user_id: eq(user.id) }),
    select("topics", { user_id: eq(user.id) }),
  ]);
  return new Response(JSON.stringify({ user, publication, writers, subscribers, newsletters, topics }, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "content-disposition": 'attachment; filename="automailx-mis-datos.json"', "cache-control": "no-store" },
  });
});

/** Borra la cuenta y TODO lo asociado (en cascada). */
export const DELETE = authed(async (_req, user) => {
  await remove("users", { id: eq(user.id) });
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json", "set-cookie": `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax` },
  });
});
