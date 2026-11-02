import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoMailX · Tu redactor de newsletters",
  description: "Cuéntale tu semana a un redactor con personalidad y recibe una newsletter lista para enviar. En español, sin plantillas.",
};

export const viewport: Viewport = { themeColor: "#fbfaf8", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
