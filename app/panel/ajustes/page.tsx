import Link from "next/link";
import Animal from "@/components/Animal";
import SettingsForm from "@/components/SettingsForm";
import { requireUser } from "@/lib/auth";
import { getPublication, getWriters } from "@/lib/data";
import { baseUrl } from "@/lib/util";

export default async function SettingsPage() {
  const user = await requireUser();
  const [pub, writers, base] = await Promise.all([getPublication(user.id), getWriters(user.id), baseUrl()]);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Ajustes</h1>
      <div className="space-y-8">
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold">Tu equipo</h2>
          <ul className="space-y-2">
            {writers.map((w) => (
              <li key={w.id}>
                <Link href={`/panel/redactores/${w.id}`} className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-black/[0.03]">
                  <Animal id={w.animal} size={44} />
                  <span className="font-medium">{w.name}</span>
                  <span className="ml-auto text-sm text-muted">Ajustar ›</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <SettingsForm
          email={user.email}
          baseUrl={base}
          initial={{ name: pub.name, sender_name: pub.sender_name, slug: pub.slug, reply_to: pub.reply_to ?? "", cadence_day: pub.cadence_day }}
        />
      </div>
    </div>
  );
}
