"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface WhitelistEntry {
  id: string;
  email: string;
  addedAt: Date;
}

interface Props {
  entries: WhitelistEntry[];
  registeredEmails: string[];
}

export default function WhitelistManager({ entries, registeredEmails }: Props) {
  const router = useRouter();
  const [pasted, setPasted] = useState("");
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);
  const [error, setError] = useState("");

  const registeredSet = new Set(registeredEmails.map((e) => e.toLowerCase()));

  async function addEmails() {
    if (!pasted.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    const res = await fetch("/api/admin/whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails: pasted }),
    });
    const data = await res.json();
    if (res.ok) {
      setResult(data);
      setPasted("");
      router.refresh();
    } else {
      setError(data.error);
    }
    setLoading(false);
  }

  async function removeEmail(email: string) {
    if (!confirm(`Remove ${email} from the whitelist?`)) return;
    setRemoving(email);
    await fetch("/api/admin/whitelist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setRemoving(null);
    router.refresh();
  }

  const pending = entries.filter((e) => !registeredSet.has(e.email));
  const registered = entries.filter((e) => registeredSet.has(e.email));

  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Registration whitelist</h2>
      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 20 }}>
        Only emails on this list can create accounts. Paste from your course management system — one email per line.
      </p>

      <textarea
        value={pasted}
        onChange={(e) => setPasted(e.target.value)}
        placeholder={"student1@dartmouth.edu\nstudent2@dartmouth.edu"}
        style={{
          width: "100%", height: 120, fontSize: 13,
          fontFamily: "var(--font-mono)", padding: "10px 12px",
          borderRadius: 8, border: "0.5px solid var(--color-border-secondary)",
          background: "var(--color-background-secondary)",
          color: "var(--color-text-primary)", resize: "vertical",
          marginBottom: 8, display: "block",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={addEmails} disabled={loading || !pasted.trim()}>
          {loading ? "Adding…" : "Add to whitelist"}
        </button>
        {result && (
          <span style={{ fontSize: 13, color: "#1D9E75" }}>
            {result.added} added{result.skipped > 0 ? `, ${result.skipped} already present` : ""}
          </span>
        )}
        {error && <span style={{ fontSize: 13, color: "red" }}>{error}</span>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Total whitelisted", value: entries.length },
          { label: "Registered", value: registered.length },
          { label: "Not yet registered", value: pending.length },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 500 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {entries.length > 0 && (
        <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, overflow: "hidden" }}>
          {pending.length > 0 && (
            <>
              <div style={{ padding: "8px 14px", fontSize: 11, fontWeight: 500, color: "var(--color-text-tertiary)", background: "var(--color-background-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Not yet registered — {pending.length}
              </div>
              {pending.map((entry, i) => (
                <div key={entry.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", borderTop: i === 0 ? "none" : "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)" }}>
                  <span style={{ fontSize: 13, fontFamily: "var(--font-mono)" }}>{entry.email}</span>
                  <button onClick={() => removeEmail(entry.email)} disabled={removing === entry.email} style={{ fontSize: 12, color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer" }}>
                    {removing === entry.email ? "…" : "remove"}
                  </button>
                </div>
              ))}
            </>
          )}
          {registered.length > 0 && (
            <>
              <div style={{ padding: "8px 14px", fontSize: 11, fontWeight: 500, color: "var(--color-text-tertiary)", background: "var(--color-background-secondary)", borderTop: pending.length > 0 ? "0.5px solid var(--color-border-tertiary)" : "none", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Registered — {registered.length}
              </div>
              {registered.map((entry, i) => (
                <div key={entry.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", borderTop: i === 0 ? "none" : "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)" }}>
                  <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>{entry.email}</span>
                  <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 99, background: "#E1F5EE", color: "#085041" }}>registered</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {entries.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          No emails on the whitelist yet. Paste your class list above to get started.
        </p>
      )}
    </section>
  );
}
