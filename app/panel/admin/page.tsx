import { notFound } from "next/navigation";
import AdminUsers from "@/components/AdminUsers";
import { requireUser } from "@/lib/auth";
import { getAccount } from "@/lib/data";
import { select } from "@/lib/db";

export const metadata = { title: "Administración · AutoMailX" };

export default async function AdminPage() {
  const user = await requireUser();
  if (!(await getAccount(user.id)).is_admin) notFound();
  const [users, domains] = await Promise.all([
    select<{ id: string; email: string; plan: "free" | "pro"; is_admin: boolean; created_at: string }>("users", { select: "id,email,plan,is_admin,created_at", order: "created_at.desc", limit: 1000 }),
    select<{ user_id: string; name: string; status: string }>("sender_domains", { select: "user_id,name,status", limit: 1000 }),
  ]);
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
      <AdminUsers rows={users.map((u) => ({ ...u, domain: byUser.get(u.id)?.name ?? null, domainStatus: byUser.get(u.id)?.status ?? null }))} />
    </div>
  );
}
