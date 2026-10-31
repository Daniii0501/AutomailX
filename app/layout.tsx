import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoMailX — Cuenta tu semana, tu newsletter ya está escrita",
  description:
    "Habla 30 segundos y AutoMailX convierte tu nota de voz en una newsletter lista para enviar, con tu tono y diseño cuidado.",
};

export const viewport: Viewport = {
  themeColor: "#0b0b10",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
