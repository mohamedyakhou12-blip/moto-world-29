import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Moto World 29 - Gestion de Magasin",
  description: "Logiciel de gestion de stock, ventes et profits pour Moto World 29",
  keywords: ["Moto World 29", "gestion", "stock", "ventes", "pièces moto"],
  authors: [{ name: "Moto World 29" }],
  icons: {
    icon: "/moto-world-logo.jpg",
    apple: "/moto-world-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
