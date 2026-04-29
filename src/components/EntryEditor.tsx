"use client";
// src/components/EntryEditor.tsx
// Inline entry editor. Shows edit button within 48 hours of posting.
// After 48 hours the entry becomes read-only.

import { useState } from "react";
import { useRouter } from "next/navigation";
import MarkdownBody from "./MarkdownBody";

interface Props {
  entryId: string;
  body: string;
  createdAt: Date;
  updatedAt?: Date | null;
  isOwner: boolean;
  proseClassName?: string;
}

const EDIT_WINDOW_HOURS = 48;

export default function EntryEditor({
  entryId,
  body,
  createdAt,
  updatedAt,
  isOwner,
  proseClassName,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(body);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const hoursSince = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  const canEdit = isOwner && hoursSince <= EDIT_WINDOW_HOURS;
  const wasEdited = updatedAt && new Date(updatedAt).getTime() !== new Date(createdAt).getTime();

  async function save() {
    if (!value.trim()) return;
    if (value.trim() === body) { setEditing(false); return; }
    setSaving(true);
    setError("");
    const res = await fetch(`/api/entries/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: value.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setEditing(false);
      router.refresh();
    } else {
      setError(data.error);
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          style={{
            width: "100%",
            minHeight: 200,
            fontFamily: "var(--serif)",
            fontSize: 15,
            lineHeight: 1.85,
            padding: "12px 14px",
            border: "1px solid var(--green)",
            borderRadius: 8,
            background: "white",
            color: "var(--ink)",
            resize: "vertical",
          }}
        />
        {error && (
          <span style={{ fontSize: 12, color: "#7A1F1F" }}>{error}</span>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={save}
            disabled={saving || !value.trim()}
            style={{
              fontSize: 12, padding: "6px 16px", borderRadius: 6,
              background: "var(--green)", color: "white", border: "none", cursor: "pointer",
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => { setValue(body); setEditing(false); setError(""); }}
            disabled={saving}
            style={{
              fontSize: 12, padding: "6px 14px", borderRadius: 6,
              background: "none", border: "1px solid var(--border)", cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <MarkdownBody text={body} className={proseClassName} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        {wasEdited && (
          <span style={{ fontSize: 11, color: "var(--ink-faint)", fontStyle: "italic" }}>
            edited
          </span>
        )}
        {canEdit && (
          <button
            onClick={() => setEditing(true)}
            style={{
              fontSize: 11, color: "var(--ink-faint)", background: "none",
              border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: 4,
            }}
          >
            edit
          </button>
        )}
        {isOwner && !canEdit && hoursSince > EDIT_WINDOW_HOURS && (
          <span style={{ fontSize: 11, color: "var(--ink-faint)", fontStyle: "italic" }}>
            edit window closed
          </span>
        )}
      </div>
    </div>
  );
}
