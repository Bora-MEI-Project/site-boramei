import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BoraMEI | Simplifique sua gestão",
  description: "A plataforma mais simples para gerenciamento de negócio MEI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      // Extensões do navegador (modo escuro, tradutor...) injetam atributos no
      // <html> antes do React hidratar — ex.: style="filter: none". Isso só
      // silencia diferenças de atributo nesta tag, não no resto da página.
      suppressHydrationWarning
      className={`scroll-smooth ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
