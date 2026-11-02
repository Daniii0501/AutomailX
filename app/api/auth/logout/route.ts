import { COOKIE, endSession } from "@/lib/auth";
import { baseUrl, cookieFrom, fail, open, sameOrigin } from "@/lib/http";

export const POST = open(async (req) => {
  if (!sameOrigin(req)) return fail("Petición no permitida.", 403);
  await endSession(cookieFrom(req, COOKIE)).catch(() => {});
  return new Response(null, {
    status: 303,
    headers: { location: `${baseUrl(req)}/`, "set-cookie": `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax` },
  });
});
