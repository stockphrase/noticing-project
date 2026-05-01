"use client";
// src/components/EntriesList.tsx
// Renders journal entries with a sort order toggle.
// Default: oldest first (chronological — discovery order).

import { useState } from "react";
import EntryEditor from "./EntryEditor";
import PhotoPrint from "./PhotoPrint";

interface Media {
  id: string;
  type: string;
  url: string;
}

interface Entry {
  id: string;
  body: string;
  createdAt: Date;
  media: Media[];
}

interface Props {
  entries: Entry[];
  isOwner: boolean;
  termActive: boolean;
  styles: Record<string, string>;
}

function formatStamp(d: Date) {
  return new Date(d).toLocaleString("en-US", {
    year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function getYouTubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function EntriesList({ entries, isOwner, termActive, styles }: Props) {
  const [newestFirst, setNewestFirst] = useState(false);

  const sorted = newestFirst ? [...entries].reverse() : entries;

  return (
    <>
      {entries.length > 1 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button
            onClick={() => setNewestFirst((v) => !v)}
            style={{
              fontSize: 11, color: "var(--ink-faint)", background: "none",
              border: "0.5px solid var(--border)", borderRadius: 4,
              padding: "4px 10px", cursor: "pointer", letterSpacing: "0.03em",
            }}
          >
            {newestFirst ? "↑ oldest first" : "↓ newest first"}
          </button>
        </div>
      )}

      <div className={styles.entries}>
        {sorted.map((entry) => {
          const images = entry.media.filter((m) => m.type === "image");
          const audio = entry.media.find((m) => m.type === "audio");
          const video = entry.media.find((m) => m.type === "youtube" || m.type === "url");

          return (
            <article key={entry.id} className={`${styles.entry} ${styles.paper}`}>
              <span className={`${styles.stamp} mono tiny muted`}>
                {formatStamp(entry.createdAt)}
              </span>

              {images[0] && <PhotoPrint src={images[0].url} index={0} />}

              <EntryEditor
                entryId={entry.id}
                body={entry.body}
                createdAt={entry.createdAt}
                isOwner={(isOwner && termActive)}
                proseClassName={styles.typewriter}
              />

              {images.slice(1).map((m, i) => (
                <PhotoPrint key={m.id} src={m.url} index={i + 1} />
              ))}

              {audio && (
                <audio controls src={audio.url} className={styles.audio} />
              )}

              {video && (() => {
                const ytId = getYouTubeId(video.url);
                return ytId ? (
                  <div className={styles.videoWrap}>
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&playsinline=1`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className={styles.videoFrame}
                    />
                  </div>
                ) : null;
              })()}
            </article>
          );
        })}
      </div>
    </>
  );
}
