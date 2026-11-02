import AppShell from "@/components/AppShell";
import { demoLogin, requireUser } from "@/lib/auth";
import { mailEnabled } from "@/lib/email";

export const metadata = { title: "AutoMailX" };

// Las pantallas solo leen la base de datos: si tardan más, algo va mal y es mejor fallar pronto.
export const maxDuration = 30;

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const notes: string[] = [];
  if (!mailEnabled()) notes.push("Los correos aún no se envían de verdad: falta conectar el servicio de correo (RESEND_API_KEY).");
  if (demoLogin) notes.push("Entrada directa de pruebas activada: quítala (ALLOW_DEMO_LOGIN) antes de usarlo con gente real.");

  return (
    <AppShell email={user.email} banner={notes.length ? notes.join(" ") : null}>
      {children}
    </AppShell>
  );
}
