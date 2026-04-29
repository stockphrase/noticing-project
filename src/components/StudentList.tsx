"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Spot {
  id: string;
  name: string;
  termId: string;
  _count: { entries: number };
}

interface Enrollment {
  term: { id: string; name: string; status: string };
}

interface Student {
  id: string;
  username: string;
  email: string;
  displayName: string;
  createdAt: Date;
  spots: Spot[];
  enrollments: Enrollment[];
}

interface Term {
  id: string;
  name: string;
  status: string;
}

interface Props {
  users: Student[];
  activeTerm: Term | null;
}

export default function StudentList({ users, activeTerm }: Props) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  async function removeUser(id: string, name: string) {
    if (!confirm(`Remove ${name}? This will delete their account, spot, and all entries permanently.`)) return;
    setRemoving(id);
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setRemoving(null);
    router.refresh();
  }

  const activeSpotCount = activeTerm
    ? users.filter((u) => u.spots.some((s) => s.termId === activeTerm.id)).length
    : 0;

  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 500 }}>Students</h2>
        {activeTerm && (
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
            {activeSpotCount} of {users.length} have claimed a spot this term
          </span>
        )}
      </div>

      <input
        type="text"
        placeholder="Search by name, email, or username…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ fontSize: 13, marginBottom: 12, width: "100%" }}
      />

      {filtered.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          {users.length === 0 ? "No students registered yet." : "No results."}
        </p>
      )}

      <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, overflow: "hidden" }}>
        {filtered.map((student, i) => {
          const activeSpot = activeTerm
            ? student.spots.find((s) => s.termId === activeTerm.id)
            : null;

          return (
            <div key={student.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", padding: "11px 14px", borderTop: i === 0 ? "none" : "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{student.displayName}</span>
                  <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontFamily: "var(--font-mono)" }}>@{student.username}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{student.email}</div>
                {activeSpot ? (
                  <div style={{ fontSize: 11, color: "#0F6E56", marginTop: 2 }}>
                    <Link href={`/spot/${activeSpot.id}`} style={{ color: "#0F6E56", textDecoration: "none" }}>
                      {activeSpot.name}
                    </Link>
                    {" "}· {activeSpot._count.entries} entries
                  </div>
                ) : activeTerm ? (
                  <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>no spot claimed yet</div>
                ) : null}
              </div>
              <button onClick={() => removeUser(student.id, student.displayName)} disabled={removing === student.id} style={{ fontSize: 12, color: "var(--color-text-tertiary)", background: "none", border: "none", cursor: "pointer", padding: "2px 6px", flexShrink: 0 }}>
                {removing === student.id ? "…" : "remove"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
