import { NextResponse } from "next/server";
import { body, guard } from "@/lib/api";
import { COOKIE } from "@/lib/auth";
import { run } from "@/lib/db";
import { json, normEmail } from "@/lib/util";

/** Borra la cuenta y todos sus datos (derecho de supresión). */
export async function DELETE(req: Request) {
  const user = await guard(req);
  if (user instanceof Response) return user;

  const b = await body<{ confirm?: string }>(req);
  if (normEmail(String(b.confirm ?? "")) !== user.email) {
    return json({ error: "Escribe tu correo para confirmar." }, 400);
  }
  for (const sql of [
    "DELETE FROM newsletters WHERE user_id = ?",
    "DELETE FROM subscribers WHERE user_id = ?",
    "DELETE FROM writers WHERE user_id = ?",
    "DELETE FROM publications WHERE user_id = ?",
    "DELETE FROM sessions WHERE user_id = ?",
    "DELETE FROM users WHERE id = ?",
  ]) {
    await run(sql, [user.id]);
  }
  await run("DELETE FROM login_tokens WHERE email = ?", [user.email]);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
