import Link from "next/link";
import DomainSettings from "@/components/DomainSettings";
import { LegalFooter } from "@/components/Legal";
import SettingsForm from "@/components/SettingsForm";
import { requireUser } from "@/lib/auth";
import { getAccount, getPublication } from "@/lib/data";
import { getDomain, refreshDomain } from "@/lib/domains";
import { platformAddress } from "@/lib/email";

export default async function SettingsPage() {
  const user = await requireUser();
  const [pub, account] = await Promise.all([getPublication(user.id), getAccount(user.id)]);
  let domain = await getDomain(user.id);
  // Si el dominio aún no está verificado, miramos en Resend cómo va (como mucho una vez cada 2 minutos).
  if (domain && domain.status !== "verified" && (!domain.checked_at || Date.now() - Date.parse(domain.checked_at) > 120_000)) {
    const r = await refreshDomain(user.id, { verify: false }).catch(() => null);
    if (r?.ok) domain = r.domain;
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ajustes</h1>
        <p className="mt-1 text-muted">Cómo se presenta tu newsletter.</p>
      </div>
      <SettingsForm email={user.email} initial={{ name: pub.name, senderName: pub.sender_name, replyTo: pub.reply_to ?? "", cadenceDay: pub.cadence_day }} />
      <DomainSettings
        plan={account.plan}
        domain={domain && { name: domain.name, from_local: domain.from_local, status: domain.status, records: domain.records, checked_at: domain.checked_at }}
        platformAddress={platformAddress()}
        senderName={pub.sender_name}
      />
      <LegalFooter className="!justify-start" />
      {account.is_admin && (
        <Link href="/panel/admin" className="card flex items-center justify-between p-5 hover:bg-[#faf9f7]">
          <span>
            <span className="block font-bold">Administración</span>
            <span className="text-sm text-muted">Usuarios y planes (solo tú ves esto).</span>
          </span>
          <span aria-hidden className="text-muted">›</span>
        </Link>
      )}
    </div>
  );
}
