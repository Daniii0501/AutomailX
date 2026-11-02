import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Panel · AutoMailX", robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <AppShell email={user.email}>{children}</AppShell>;
}
