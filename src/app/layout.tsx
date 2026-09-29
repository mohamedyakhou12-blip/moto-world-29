import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "موتو ورلد 29 - إدارة المتجر",
  description: "برنامج إدارة المخزون والمبيعات والأرباح لمتجر موتو ورلد 29",
  keywords: ["موتو ورلد 29", "إدارة", "مخزون", "مبيعات", "قطع غيار"],
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
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} antialiased bg-background text-foreground`}
        style={{ fontFamily: "var(--font-cairo), system-ui, sans-serif" }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
