import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NetAprèsTax — SAIS-TU VRAIMENT CE QU'IL TE RESTE ?",
  description:
    "Calcule ton vrai revenu net en auto-entrepreneur. Cotisations, impôts, frais — vois ce qu'il te reste dans la poche.",
  keywords: [
    "auto-entrepreneur",
    "simulateur",
    "revenu net",
    "cotisations URSSAF",
    "micro-entreprise",
    "freelance",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
