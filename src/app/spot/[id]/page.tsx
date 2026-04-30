// src/app/spot/[id]/page.tsx
// Public journal page for a single spot. Anyone can read.
// The owner sees a "New Noticing" button.

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AbandonSpot from "@/components/AbandonSpot";
import PhotoPrint from "@/components/PhotoPrint";
import MarkdownBody from "@/components/MarkdownBody";
import SpotNameEditor from "@/components/SpotNameEditor";
import EntryEditor from "@/components/EntryEditor";
import MiniMap from "@/components/MiniMap";
import styles from "./spot.module.css";

interface Props { params: Promise<{ id: string }>; }

function formatStamp(date: Date) {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    " · " +
    pad(d.getHours()) + ":" +
    pad(d.getMinutes())
  );
}

function YouTubeEmbed({ url }: { url: string }) {
  const id = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  )?.[1];
  if (!id) return <a href={url} target="_blank" rel="noopener noreferrer" className="small muted">{url}</a>;
  return (
    <div className={styles.videoWrap}>
      <iframe
        src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`}
        title="video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className={styles.videoFrame}
      />
    </div>
  );
}

export default async function SpotPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;

  const spot = await prisma.spot.findUnique({
    where: { id: id },
    include: {
      user: { select: { displayName: true, username: true } },
      term: { select: { name: true, status: true } },
      entries: {
        include: { media: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!spot) notFound();

  const isOwner = userId === spot.userId;
  const isAdmin = userRole === "admin";

  return (
    <div className={styles.layout}>
      {/* Journal column */}
      <main className={styles.journal}>
        {/* Header */}
        <div className={styles.header}>
          <Link href="/map" className="small muted" style={{ textDecoration: "none", display: "block", marginBottom: 16 }}>
            ← map
          </Link>
          {isOwner && spot.term.status === "active" ? (
            <SpotNameEditor spotId={spot.id} name={spot.name} titleClassName={styles.spotTitle} />
          ) : (
            <h1 className={styles.spotTitle}>{spot.name}</h1>
          )}
          <div className={styles.meta}>
            <span>observed by {spot.user.displayName}</span>
            <span className={styles.metaDot}>·</span>
            <span>{spot.term.name}</span>
            <span className={styles.metaDot}>·</span>
            <span>{spot.entries.length} entries</span>
            {spot.term.status === "archived" && (
              <>
                <span className={styles.metaDot}>·</span>
                <span className="badge">archived</span>
              </>
            )}
          </div>
          {isOwner && spot.term.status === "active" && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
              <Link
                href={`/new-noticing?spot=${spot.id}`}
                className="btn btn--primary"
              >
                + New Noticing
              </Link>
              <AbandonSpot spotId={spot.id} spotName={spot.name} />
            </div>
          )}
        </div>

        <div className={styles.divider} />

        {/* Entries */}
        {spot.entries.length === 0 ? (
          <p className="small muted" style={{ padding: "40px 0" }}>
            No observations yet.{isOwner ? " Add your first noticing above." : ""}
          </p>
        ) : (
          <div className={styles.entries}>
            {spot.entries.map((entry) => {
              const images = entry.media.filter((m) => m.type === "image");
              const audio  = entry.media.find((m) => m.type === "audio");
              const video  = entry.media.find((m) => m.type === "youtube" || m.type === "url");
              return (
                <article key={entry.id} className={`${styles.entry} ${styles.paper}`}>
                  <div className={`entry-datestamp ${styles.stamp}`}>
                    {formatStamp(entry.createdAt)}
                  </div>

                  {/* Photos as physical prints */}
                  {images[0] && (
                    <PhotoPrint src={images[0].url} index={0} />
                  )}

                  <EntryEditor
                    entryId={entry.id}
                    body={entry.body}
                    createdAt={entry.createdAt}
                    isOwner={(isOwner && spot.term.status === "active") || isAdmin}
                    proseClassName={styles.typewriter}
                  />

                  {/* Additional photos */}
                  {images.slice(1).map((m, i) => (
                    <PhotoPrint key={m.id} src={m.url} index={i + 1} />
                  ))}

                  {audio && (
                    <audio controls src={audio.url} className={styles.audio} />
                  )}

                  {video && <YouTubeEmbed url={video.url} />}
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Mini map column */}
      <aside className={styles.mapCol}>
        <div className={styles.miniMap} style={{ display: "flex", flexDirection: "column" }}>
          <MiniMap lat={spot.lat} lng={spot.lng} />
        </div>
        <div className={styles.mapFooter}>
          <div className="small" style={{ fontWeight: 500 }}>{spot.name}</div>
          <div className="tiny muted">
            {spot.lat.toFixed(5)}° N, {Math.abs(spot.lng).toFixed(5)}° W
          </div>
        </div>
      </aside>
    </div>
  );
}

// Minimal client component just to boot the Leaflet mini-map
function MiniMapScript({ lat, lng }: { lat: number; lng: number }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(async () => {
  if (typeof window === 'undefined') return;
  const L = (await import('/node_modules/leaflet/dist/leaflet-src.esm.js')).default;
  const map = L.map('mini-map', { zoomControl: false, dragging: false, scrollWheelZoom: false })
    .setView([${lat}, ${lng}], 17);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  const icon = L.divIcon({ className: '',
    html: '<div style="width:14px;height:14px;border-radius:50%;background:#1D9E75;border:2.5px solid white;"></div>',
    iconSize:[14,14], iconAnchor:[7,7] });
  L.marker([${lat},${lng}], {icon}).addTo(map);
})();
      `,
      }}
    />
  );
}
