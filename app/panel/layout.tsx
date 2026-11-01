import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { isDemoDb } from "@/lib/db";
import { mailEnabled } from "@/lib/email";

export const metadata = { title: "AutoMailX" };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  let banner: string | null = null;
  if (isDemoDb && !mailEnabled()) {
    banner = "Modo demo: los datos pueden borrarse y los correos no se envían de verdad. Conecta la base de datos y el correo para usarlo en serio.";
  } else if (isDemoDb) {
    banner = "Falta conectar la base de datos: tus datos pueden borrarse en cualquier momento.";
  } else if (!mailEnabled()) {
    banner = "Los correos aún no se envían de verdad: falta conectar el servicio de correo (RESEND_API_KEY).";
  }

  return (
    <AppShell email={user.email} banner={banner}>
      {children}
    </AppShell>
  );
}
