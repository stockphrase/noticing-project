"use client";
// src/components/SpotNameEditor.tsx
// Inline spot name editor. Click the name to edit, Enter or blur to save.

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  spotId: string;
  name: string;
  titleClassName?: string;
}

export default function SpotNameEditor({ spotId, name, titleClassName }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function save() {
    if (!value.trim() || value.trim() === name) {
      setValue(name);
      setEditing(false);
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch(`/api/spots/${spotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: value.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setEditing(false);
      router.refresh();
    } else {
      setError(data.error);
      setValue(name);
      setEditing(false);
    }
    setSaving(false);
  }

  if (editing) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") { setValue(name); setEditing(false); }
          }}
          style={{
            fontSize: "clamp(20px, 3vw, 28px)",
            fontFamily: "var(--serif)",
            fontWeight: 400,
            border: "none",
            borderBottom: "2px solid var(--green)",
            outline: "none",
            background: "transparent",
            color: "var(--ink)",
            width: "100%",
            padding: "2px 0",
          }}
          disabled={saving}
        />
        <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>
          Press Enter to save · Escape to cancel
        </span>
        {error && <span style={{ fontSize: 12, color: "#7A1F1F" }}>{error}</span>}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <h1 className={titleClassName} style={{ margin: 0 }}>{name}</h1>
      <button
        onClick={() => setEditing(true)}
        style={{
          fontSize: 11,
          color: "var(--ink-faint)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "2px 6px",
          borderRadius: 4,
          lineHeight: 1,
        }}
        title="Rename this spot"
      >
        rename
      </button>
    </div>
  );
}
