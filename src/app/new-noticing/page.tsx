"use client";
// src/app/new-noticing/page.tsx
// The compose screen. Only accessible to the spot's owner during an active term.

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { uploadToCloudinary, checkAudioDuration, UploadedMedia } from "@/lib/upload";
import styles from "./compose.module.css";

const LIMITS = { photos: 3, photoMB: 20, audioSec: 60 };

interface MediaItem {
  type: "image" | "audio" | "youtube" | "url";
  url: string;
  publicId?: string;
  previewSrc?: string; // local object URL for preview
  name?: string;
}

function formatStamp(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())} · ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function NewNoticingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const spotId = params.get("spot") ?? "";

  const [stamp] = useState(() => formatStamp(new Date()));
  const [spotName, setSpotName] = useState("");
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [modal, setModal] = useState<"photo" | "audio" | "video" | null>(null);
  const [ytUrl, setYtUrl] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!spotId) return;
    fetch(`/api/spots/${spotId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setSpotName(d.name));
  }, [spotId]);

  const photos = media.filter((m) => m.type === "image");
  const hasAudio = media.some((m) => m.type === "audio");
  const hasVideo = media.some((m) => m.type === "youtube" || m.type === "url");
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;

  async function handleImageFile(file: File) {
    if (photos.length >= LIMITS.photos) return setError(`Max ${LIMITS.photos} photos per entry.`);
    if (file.size > LIMITS.photoMB * 1024 * 1024) return setError(`Photo too large. Max ${LIMITS.photoMB} MB.`);
    setUploading(true);
    setModal(null);
    try {
      const uploaded = await uploadToCloudinary(file, "image");
      setMedia((m) => [...m, { ...uploaded, previewSrc: URL.createObjectURL(file) }]);
    } catch { setError("Upload failed. Please try again."); }
    setUploading(false);
  }

  async function handleAudioFile(file: File) {
    setModal(null);
    const ok = await checkAudioDuration(file, LIMITS.audioSec);
    if (!ok) return setError(`Audio must be ${LIMITS.audioSec} seconds or less.`);
    setUploading(true);
    try {
      const uploaded = await uploadToCloudinary(file, "audio");
      setMedia((m) => [...m, { ...uploaded, name: file.name }]);
    } catch { setError("Upload failed. Please try again."); }
    setUploading(false);
  }

  function addYoutube() {
    if (!ytUrl.trim()) return;
    setMedia((m) => [...m, { type: "youtube", url: ytUrl.trim() }]);
    setYtUrl("");
    setModal(null);
  }

  function removeMedia(idx: number) {
    setMedia((m) => m.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!body.trim()) return setError("Please write something before posting.");
    setSaving(true);
    setError("");
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body,
        spotId,
        media: media.map(({ type, url, publicId }) => ({ type, url, publicId })),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push(`/spot/${spotId}`);
    } else {
      setError(data.error);
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Header */}
        <div className={styles.head}>
          <button className="btn btn--ghost small" onClick={() => router.back()}>
            ← {spotName || "back"}
          </button>
          <div className={styles.headRight}>
            <span className="entry-datestamp">{stamp}</span>
          </div>
        </div>

        {/* Writing area */}
        <div className={styles.writeWrap}>
          <textarea
            className={styles.textarea}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            autoFocus
          />
          <span className={`${styles.wc} tiny faint`}>
            {wordCount > 0 ? `${wordCount} word${wordCount !== 1 ? "s" : ""}` : ""}
          </span>
        </div>

        {/* Media preview */}
        {media.length > 0 && (
          <div className={styles.mediaRow}>
            {media.map((m, i) => (
              <div key={i} className={styles.mediaPill}>
                {m.type === "image" && m.previewSrc && (
                  <img src={m.previewSrc} alt="" className={styles.thumbImg} />
                )}
                {m.type === "audio" && (
                  <span className={`${styles.thumbLabel} mono`}>♪ {m.name}</span>
                )}
                {(m.type === "youtube" || m.type === "url") && (
                  <span className={`${styles.thumbLabel} small`}>▶ video</span>
                )}
                <button className={styles.removeBtn} onClick={() => removeMedia(i)}>×</button>
              </div>
            ))}
            {uploading && (
              <div className={`${styles.mediaPill} ${styles.uploading}`}>
                <span className="tiny muted">uploading…</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="notice notice--error small" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}

        {/* Bottom bar */}
        <div className={styles.bottomBar}>
          <div className={styles.attachGroup}>
            <button
              className="btn btn--ghost small"
              disabled={photos.length >= LIMITS.photos || uploading}
              onClick={() => setModal("photo")}
            >
              photo {photos.length > 0 && `(${photos.length}/${LIMITS.photos})`}
            </button>
            <button
              className="btn btn--ghost small"
              disabled={hasAudio || uploading}
              onClick={() => setModal("audio")}
            >
              audio
            </button>
            <button
              className="btn btn--ghost small"
              disabled={hasVideo}
              onClick={() => setModal("video")}
            >
              video
            </button>
          </div>
          <button
            className="btn btn--primary"
            disabled={!body.trim() || saving}
            onClick={handleSubmit}
          >
            {saving ? "posting…" : "post noticing"}
          </button>
        </div>
      </div>

      {/* Modals */}
      {modal && (
        <div className={styles.overlay} onClick={() => setModal(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3 className={styles.modalTitle}>
                {modal === "photo" ? "Attach a photo" : modal === "audio" ? "Attach audio" : "Embed video"}
              </h3>
              <button className="btn btn--ghost small" onClick={() => setModal(null)}>×</button>
            </div>

            {modal === "photo" && (
              <label className={styles.dropZone}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
                />
                <div className={styles.dropIcon}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect x="2" y="7" width="28" height="18" rx="4" stroke="#1D9E75" strokeWidth="1.5"/>
                    <circle cx="11" cy="15" r="3" stroke="#1D9E75" strokeWidth="1.5"/>
                    <path d="M2 21l7-6 5 5 4-4 5 5" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="small muted" style={{ textAlign: "center" }}>
                  Tap or drag a photo here<br />
                  <span className="tiny faint">JPG, PNG, HEIC · max {LIMITS.photoMB} MB · auto-compressed on upload</span>
                </p>
              </label>
            )}

            {modal === "audio" && (
              <label className={styles.dropZone}>
                <input
                  type="file"
                  accept="audio/*"
                  style={{ display: "none" }}
                  onChange={(e) => e.target.files?.[0] && handleAudioFile(e.target.files[0])}
                />
                <div className={styles.dropIcon}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect x="11" y="2" width="10" height="18" rx="5" stroke="#1D9E75" strokeWidth="1.5"/>
                    <path d="M5 16c0 6 4.5 9 11 9s11-3 11-9" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="16" y1="25" x2="16" y2="30" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="small muted" style={{ textAlign: "center" }}>
                  Tap to attach a voice memo or recording<br />
                  <span className="tiny faint">MP3, M4A, WAV · max {LIMITS.audioSec} seconds</span>
                </p>
              </label>
            )}

            {modal === "video" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p className="small muted">
                  Upload to YouTube (unlisted is fine), then paste the link here.
                  Max 60 seconds.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={ytUrl}
                    onChange={(e) => setYtUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=…"
                    onKeyDown={(e) => e.key === "Enter" && addYoutube()}
                  />
                  <button className="btn btn--primary" onClick={addYoutube}>embed</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
