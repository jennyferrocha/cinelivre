import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import { AccountNotice } from "@/components/AccountNotice";
import { NavigationTrail } from "@/components/NavigationTrail";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Suspense } from "react";
import "./globals.css";

// Interface (botões, textos, etiquetas)
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

// Títulos e números grandes
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CineLivre",
  description: "O que assistir hoje nos streamings que você já assina.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${jakarta.variable} ${sora.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Header />
        {children}
        <Footer />
        <Suspense fallback={null}>
          <AccountNotice />
        </Suspense>
        <Suspense fallback={null}>
          <NavigationTrail />
        </Suspense>
      </body>
    </html>
  );
}
