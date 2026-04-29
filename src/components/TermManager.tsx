"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Term {
  id: string;
  name: string;
  status: string;
  createdAt: Date;
  startedAt?: Date | null;
  archivedAt?: Date | null;
  _count: { spots: number; enrollments: number };
}

export default function TermManager({ terms }: { terms: Term[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function createTerm() {
    if (!newName.trim()) return;
    setLoading("create");
    setError("");
    const res = await fetch("/api/terms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      setNewName("");
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.error);
    }
    setLoading(null);
  }

  async function termAction(id: string, action: "activate" | "archive") {
    const confirmMsg =
      action === "archive"
        ? "Archive this term? All journals will become read-only."
        : "Activate this term? Any currently active term will be archived.";
    if (!confirm(confirmMsg)) return;
    setLoading(id + action);
    const res = await fetch(`/api/terms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error);
    }
    setLoading(null);
    router.refresh();
  }

  const statusColor: Record<string, string> = {
    draft: "#888780",
    active: "#1D9E75",
    archived: "#AFA9EC",
  };

  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>Terms</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="e.g. Winter 2026"
          style={{ fontSize: 13, flex: 1 }}
          onKeyDown={(e) => e.key === "Enter" && createTerm()}
        />
        <button onClick={createTerm} disabled={loading === "create"}>
          {loading === "create" ? "Creating…" : "Create term"}
        </button>
      </div>
      {error && (
        <p style={{ fontSize: 12, color: "red", marginBottom: 12 }}>{error}</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {terms.map((term) => (
          <div
            key={term.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: 8,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{term.name}</span>
                <span style={{
                  fontSize: 11, padding: "1px 8px", borderRadius: 99,
                  background: statusColor[term.status] + "22",
                  color: statusColor[term.status], fontWeight: 500,
                }}>
                  {term.status}
                </span>
              </div>
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                {term._count.enrollments} students · {term._count.spots} spots
              </span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {term.status === "draft" && (
                <button onClick={() => termAction(term.id, "activate")} disabled={loading === term.id + "activate"}>
                  Activate
                </button>
              )}
              {term.status === "active" && (
                <button onClick={() => termAction(term.id, "archive")} disabled={loading === term.id + "archive"}>
                  Archive term
                </button>
              )}
            </div>
          </div>
        ))}
        {terms.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            No terms yet. Create one above to get started.
          </p>
        )}
      </div>
    </section>
  );
}
