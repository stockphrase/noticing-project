"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FlaggedEntry {
  id: string;
  reason?: string | null;
  createdAt: Date;
  entry: {
    id: string;
    body: string;
    createdAt: Date;
    spot: { id: string; name: string };
    user: { displayName: string };
    media: { id: string; type: string; url: string }[];
  };
  user: { displayName: string };
}

export default function FlaggedEntries({ flags }: { flags: FlaggedEntry[] }) {
  const router = useRouter();
  const [working, setWorking] = useState<string | null>(null);

  async function dismiss(flagId: string) {
    setWorking(flagId);
    await fetch(`/api/admin/flags/${flagId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolve" }),
    });
    setWorking(null);
    router.refresh();
  }

  async function deleteEntry(flagId: string, entryId: string) {
    if (!confirm("Delete this entry permanently? This cannot be undone.")) return;
    setWorking(flagId);
    await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
    setWorking(null);
    router.refresh();
  }

  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>
        Flagged content
        <span style={{ marginLeft: 8, fontSize: 11, padding: "1px 8px", borderRadius: 99, background: "#FCEBEB", color: "#791F1F", fontWeight: 500 }}>
          {flags.length} pending
        </span>
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {flags.map((flag) => (
          <div key={flag.id} style={{ background: "var(--color-background-primary)", border: "0.5px solid #F09595", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                Flagged by {flag.user.displayName}
                {flag.reason && ` — "${flag.reason}"`}
              </div>
              <Link href={`/spot/${flag.entry.spot.id}`} style={{ fontSize: 12, color: "#1D9E75", textDecoration: "none" }}>
                {flag.entry.spot.name} →
              </Link>
            </div>
            <div style={{ fontFamily: "serif", fontSize: 14, lineHeight: 1.7, color: "var(--color-text-primary)", marginBottom: 12, padding: "10px 12px", background: "var(--color-background-secondary)", borderRadius: 6 }}>
              {flag.entry.body.length > 300 ? flag.entry.body.slice(0, 300) + "…" : flag.entry.body}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => dismiss(flag.id)} disabled={working === flag.id} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "0.5px solid var(--color-border-secondary)", background: "transparent", cursor: "pointer" }}>
                {working === flag.id ? "…" : "dismiss flag"}
              </button>
              <button onClick={() => deleteEntry(flag.id, flag.entry.id)} disabled={working === flag.id} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "0.5px solid #F09595", background: "#FCEBEB", color: "#791F1F", cursor: "pointer" }}>
                delete entry
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
