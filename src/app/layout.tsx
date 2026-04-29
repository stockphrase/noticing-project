import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import NavClient from "@/components/NavClient";

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
    <html lang="en">
      <body>
        <SessionProvider>
          <NavClient />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
