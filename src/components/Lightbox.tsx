"use client";
// src/components/Lightbox.tsx
// Full-screen image viewer. Click any journal photo to open it.
// Click anywhere or press Escape to close.

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface Props {
  src: string;
  alt?: string;
  width: number;
  height: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Lightbox({ src, alt = "observation photo", width, height, className, style }: Props) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={{ ...style, cursor: "zoom-in" }}
        onClick={() => setOpen(true)}
      />

      {open && (
        <div
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            cursor: "zoom-out",
          }}
        >
          {/* Close button */}
          <button
            onClick={close}
            style={{
              position: "absolute",
              top: 20,
              right: 24,
              background: "none",
              border: "none",
              color: "white",
              fontSize: 32,
              cursor: "pointer",
              lineHeight: 1,
              opacity: 0.7,
            }}
            aria-label="Close"
          >
            ×
          </button>

          {/* Image — stops click propagation so clicking the image doesn't close */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              position: "relative",
              cursor: "default",
            }}
          >
            <img
              src={src}
              alt={alt}
              style={{
                maxWidth: "90vw",
                maxHeight: "90vh",
                objectFit: "contain",
                borderRadius: 8,
                display: "block",
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
