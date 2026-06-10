import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MPC/SC - Gestão de Pauta e Decisões",
  description: "Sistema de gestão e controle de pautas do TCE/SC pelo Ministério Público de Contas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
