import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoMailX — Contrata a tu redactor de newsletters",
  description:
    "Elige un animal, ponle nombre y cuéntale tu semana. Tu redactor de IA escribe la newsletter con tu estilo; tú la apruebas y la envías.",
};

export const viewport: Viewport = {
  themeColor: "#fbfaf8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
