import { NextResponse } from "next/server";
import { COOKIE, endSession } from "@/lib/auth";
import { sameOrigin } from "@/lib/util";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: "Petición no permitida." }, { status: 403 });
  await endSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
