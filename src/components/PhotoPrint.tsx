"use client";
// src/components/PhotoPrint.tsx
// Renders a photo as a physical print laid on the journal page.
// Odd-indexed photos tilt left, even-indexed tilt right.
// Clicking opens the full-screen lightbox — no paper effect inside.

import { useState, useEffect, useCallback } from "react";

interface Props {
  src: string;
  alt?: string;
  index?: number; // 0-based — controls tilt direction
}

const TILTS = [-2.4, 1.8, -1.5, 2.6, -2.1]; // alternating left/right

export default function PhotoPrint({ src, alt = "observation photo", index = 0 }: Props) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  const tilt = TILTS[index % TILTS.length];
  // Odd index floats left, even floats right (first photo = index 0 = right, second = left, etc.)
  const floatDir = index % 2 === 0 ? "right" : "left";
  const marginStyle = floatDir === "right"
    ? { float: "right" as const, margin: "4px 0 16px 24px" }
    : { float: "left" as const, margin: "4px 24px 16px 0" };

  return (
    <>
      <div style={{ ...marginStyle, position: "relative", display: "inline-block" }}>
        <div
          onClick={() => setOpen(true)}
          style={{
            background: "white",
            padding: "8px 8px 28px 8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.18), 0 6px 16px rgba(0,0,0,0.12)",
            transform: `rotate(${tilt}deg)`,
            cursor: "zoom-in",
            display: "inline-block",
            position: "relative",
          }}
        >
          <img
            src={src}
            alt={alt}
            style={{
              display: "block",
              width: 160,
              height: 120,
              objectFit: "cover",
            }}
          />
        </div>
      </div>

      {open && (
        <div
          onClick={close}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24, cursor: "zoom-out",
          }}
        >
          <button
            onClick={close}
            style={{
              position: "absolute", top: 20, right: 24,
              background: "none", border: "none", color: "white",
              fontSize: 32, cursor: "pointer", opacity: 0.7, lineHeight: 1,
            }}
            aria-label="Close"
          >×</button>
          <div onClick={(e) => e.stopPropagation()} style={{ cursor: "default" }}>
            <img
              src={src}
              alt={alt}
              style={{
                maxWidth: "90vw", maxHeight: "90vh",
                objectFit: "contain", borderRadius: 4, display: "block",
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
