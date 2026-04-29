"use client";
// src/components/AbandonSpot.tsx
// Shown only to the spot owner during an active term.
// Confirms intent, then deletes the spot and all its entries,
// and redirects to the map so the student can claim a new spot.

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  spotId: string;
  spotName: string;
}

export default function AbandonSpot({ spotId, spotName }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    const res = await fetch(`/api/spots/${spotId}`, { method: "DELETE" });
    if (res.ok) {
      // Redirect to map — student can now claim a new spot
      router.push("/map");
    } else {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <button
        className="btn btn--ghost small"
        style={{ color: "var(--ink-faint)", fontSize: 12 }}
        onClick={() => setConfirming(true)}
      >
        abandon spot
      </button>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "14px 16px",
        background: "#FCEBEB",
        border: "1px solid #F09595",
        borderRadius: "var(--radius-md)",
        maxWidth: 360,
      }}
    >
      <p style={{ fontSize: 13, color: "#4A1010", lineHeight: 1.55 }}>
        <strong>Abandon "{spotName}"?</strong><br />
        This will permanently delete this spot and all{" "}
        your observations. You'll be taken back to the map to claim a new spot.
        This cannot be undone.
      </p>

      {error && (
        <p style={{ fontSize: 12, color: "#7A1F1F" }}>{error}</p>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          style={{
            fontSize: 12,
            padding: "6px 14px",
            borderRadius: "var(--radius-md)",
            border: "1px solid #F09595",
            background: "#E24B4A",
            color: "white",
            cursor: "pointer",
            fontWeight: 500,
          }}
          disabled={deleting}
          onClick={handleDelete}
        >
          {deleting ? "Deleting…" : "Yes, abandon this spot"}
        </button>
        <button
          className="btn btn--ghost small"
          disabled={deleting}
          onClick={() => { setConfirming(false); setError(""); }}
        >
          keep it
        </button>
      </div>
    </div>
  );
}
