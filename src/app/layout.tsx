import type { Metadata } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const workSans = Work_Sans({
  variable: "--font-worksans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Assistant RS — Trinkets Design",
  description:
    "Assistant réseaux sociaux : création de contenu, programmation et analyse de performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${workSans.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
