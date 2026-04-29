// src/app/admin/page.tsx
// Admin dashboard — term management, student list, flagged content.
// Only accessible to users with role="admin".

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TermManager from "@/components/TermManager";
import StudentList from "@/components/StudentList";
import FlaggedEntries from "@/components/FlaggedEntries";
import WhitelistManager from "@/components/WhitelistManager";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    redirect("/");
  }

  const [terms, users, flags, whitelist] = await Promise.all([
    prisma.term.findMany({
      include: { _count: { select: { spots: true, enrollments: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "student" },
      include: {
        spots: { include: { _count: { select: { entries: true } } } },
        enrollments: { include: { term: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.flag.findMany({
      where: { resolved: false },
      include: {
        entry: { include: { spot: true, user: true, media: true } },
        user: { select: { displayName: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.whitelist.findMany({ orderBy: { addedAt: "desc" } }),
  ]);

  const activeTerm = terms.find((t) => t.status === "active") ?? null;

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 4 }}>
          Admin dashboard
        </h1>
        <p style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
          The Noticing Project — Dartmouth College
        </p>
      </div>

      {/* Summary stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))",
          gap: 12,
          marginBottom: 40,
        }}
      >
        {[
          { label: "Active term", value: activeTerm?.name ?? "None" },
          { label: "Students", value: users.length },
          {
            label: "Spots claimed",
            value: activeTerm
              ? users.flatMap((u) => u.spots).filter(
                  (s: any) => s.termId === activeTerm.id
                ).length
              : "—",
          },
          { label: "Flags pending", value: flags.length },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--color-background-secondary)",
              borderRadius: 8,
              padding: "12px 16px",
            }}
          >
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 500 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <TermManager terms={terms} />
      <WhitelistManager
        entries={whitelist}
        registeredEmails={users.map((u) => u.email)}
      />
      <StudentList users={users} activeTerm={activeTerm} />
      {flags.length > 0 && <FlaggedEntries flags={flags} />}
    </main>
  );
}
