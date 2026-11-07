import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { getAccount } from "@/lib/data";

export const metadata = { title: "Panel · AutoMailX", robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { plan } = await getAccount(user.id);
  return <AppShell email={user.email} plan={plan}>{children}</AppShell>;
}
