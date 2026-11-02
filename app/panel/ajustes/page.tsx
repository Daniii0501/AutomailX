import SettingsForm from "@/components/SettingsForm";
import { requireUser } from "@/lib/auth";
import { getPublication } from "@/lib/data";

export default async function SettingsPage() {
  const user = await requireUser();
  const pub = await getPublication(user.id);
  return (
    <div>
      <h1 className="text-3xl font-bold">Ajustes</h1>
      <p className="mt-1 mb-6 text-muted">Cómo se presenta tu newsletter.</p>
      <SettingsForm email={user.email} initial={{ name: pub.name, senderName: pub.sender_name, replyTo: pub.reply_to ?? "", cadenceDay: pub.cadence_day }} />
    </div>
  );
}
