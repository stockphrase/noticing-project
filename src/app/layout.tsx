// src/app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/lib/auth";
import NavClient from "@/components/NavClient";

export const metadata: Metadata = {
  title: "The Noticing Project — Dartmouth",
  description:
    "A field journal platform for slow, contemplative observation on the Dartmouth College campus.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user ?? null;

  return (
    <html lang="en">
      <body>
        <NavClient user={user} />
        {children}
      </body>
    </html>
  );
}
