import { notFound } from "next/navigation";
import AdminUsers, { TrackingButton } from "@/components/AdminUsers";
import { requireUser } from "@/lib/auth";
import { getAccount } from "@/lib/data";
import { isNull, select } from "@/lib/db";

export const metadata = { title: "Administración · AutoMailX" };

export default async function AdminPage() {
  const user = await requireUser();
  if (!(await getAccount(user.id)).is_admin) notFound();
  const [users, domains, requests] = await Promise.all([
    select<{ id: string; email: string; plan: "free" | "pro"; is_admin: boolean; created_at: string }>("users", { select: "id,email,plan,is_admin,created_at", order: "created_at.desc", limit: 1000 }),
    select<{ user_id: string; name: string; status: string }>("sender_domains", { select: "user_id,name,status", limit: 1000 }),
    select<{ user_id: string; billing: "monthly" | "yearly"; created_at: string }>("premium_requests", { select: "user_id,billing,created_at", handled_at: isNull, limit: 1000 }),
  ]);
  const reqByUser = new Map(requests.map((r) => [r.user_id, { billing: r.billing, created_at: r.created_at }]));
  const pending = users.filter((u) => u.plan !== "pro" && reqByUser.has(u.id)).length;
  const byUser = new Map(domains.map((d) => [d.user_id, d]));
  const pro = users.filter((u) => u.plan === "pro").length;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Administración</h1>
        <p className="mt-1 text-muted">
          {users.length} usuarios · {pro} Premium. Mientras no haya pagos con tarjeta, aquí activas Premium a mano a quien te pague.
        </p>
      </div>
      {pending > 0 && (
        <p className="banner banner-info">
          <strong>{pending === 1 ? "1 persona quiere" : `${pending} personas quieren`} Premium.</strong> Escríbeles para cobrarlo y pulsa «Hacer Premium». Salen las primeras de la lista.
        </p>
      )}
      <AdminUsers
        rows={users
          .map((u) => ({ ...u, domain: byUser.get(u.id)?.name ?? null, domainStatus: byUser.get(u.id)?.status ?? null, request: reqByUser.get(u.id) ?? null }))
          .sort((a, b) => Number(!!b.request && b.plan !== "pro") - Number(!!a.request && a.plan !== "pro"))}
      />
      <TrackingButton />
    </div>
  );
}
