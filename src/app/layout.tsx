import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import NavClient from "@/components/NavClient";
import { Special_Elite, Lora, DM_Sans, DM_Mono } from "next/font/google";

const specialElite = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-typewriter",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Noticing Project — Dartmouth",
  description:
    "A field journal platform for slow, contemplative observation on the Dartmouth College campus.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${specialElite.variable} ${lora.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body>
        <SessionProvider>
          <NavClient />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
