import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
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
  metadataBase: new URL("https://www.escalaiasd.com.br"),
  title: {
    default: "ESCALA IASD CANDIDO SALES",
    template: "%s | ESCALA IASD CANDIDO SALES",
  },
  description:
    "Sistema web para organizar escalas e apoio operacional da IASD Candido Sales.",
  applicationName: "ESCALA IASD CANDIDO SALES",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Escala IASD",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
