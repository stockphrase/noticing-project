"use client";
// src/app/map/page.tsx
// Main campus map — shows all spots, lets users claim a new one.

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./map.module.css";

interface Spot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  user: { displayName: string; username: string };
  _count: { entries: number };
}

export default function MapPage() {
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [claiming, setClaiming] = useState(false);
  const [pendingLatLng, setPendingLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [spotName, setSpotName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTerm, setActiveTerm] = useState<string | null>(null);

  useEffect(() => {
    let map: any;

    async function initMap() {
      const L = (await import("leaflet")).default;
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      leafletRef.current = L;

      map = L.map("map-container", { zoomControl: true }).setView([43.7044, -72.2887], 16);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);

      // Load spots and term
      const [spotsRes, termRes] = await Promise.all([
        fetch("/api/spots"),
        fetch("/api/terms/active"),
      ]);
      const spotsData = await spotsRes.json();
      const termData = termRes.ok ? await termRes.json() : null;
      setSpots(spotsData);
      setActiveTerm(termData?.id ?? null);

      // Pin icon factory
      const makeIcon = (mine: boolean) =>
        L.divIcon({
          className: "",
          html: `<div style="width:${mine ? 14 : 12}px;height:${mine ? 14 : 12}px;border-radius:50%;background:${mine ? "#1D9E75" : "#78716C"};border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.25)"></div>`,
          iconSize: [mine ? 14 : 12, mine ? 14 : 12],
          iconAnchor: [mine ? 7 : 6, mine ? 7 : 6],
        });

      // Fetch session to know which spot is mine
      const meRes = await fetch("/api/users/me");
      const me = meRes.ok ? await meRes.json() : null;

      spotsData.forEach((spot: Spot) => {
        const mine = me && spot.user.username === me.username;
        const marker = L.marker([spot.lat, spot.lng], { icon: makeIcon(mine) }).addTo(map);
        marker.on("click", () => router.push(`/spot/${spot.id}`));
        marker.bindTooltip(
          `<strong style="font-family:serif">${spot.name}</strong><br><span style="font-size:11px;color:#78716C">${spot.user.displayName} · ${spot._count.entries} entries</span>`,
          { offset: [10, 0] }
        );
      });

      // Claim mode — click map to place pending pin
      map.on("click", (e: any) => {
        if (!claiming) return;
        setPendingLatLng({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    initMap();
    return () => { if (map) map.remove(); };
  }, []);

  // Show pending pin on map
  useEffect(() => {
    if (!pendingLatLng || !leafletRef.current || !mapRef.current) return;
    const L = leafletRef.current;
    const pendingIcon = L.divIcon({
      className: "",
      html: `<div style="width:16px;height:16px;border-radius:50%;background:#1D9E75;border:3px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.3);animation:pulse 1s infinite"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    const marker = L.marker([pendingLatLng.lat, pendingLatLng.lng], {
      icon: pendingIcon,
      zIndexOffset: 1000,
    }).addTo(mapRef.current);
    return () => marker.remove();
  }, [pendingLatLng]);

  async function claimSpot() {
    if (!pendingLatLng || !spotName.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/spots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: spotName.trim(),
        lat: pendingLatLng.lat,
        lng: pendingLatLng.lng,
        termId: activeTerm,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push(`/spot/${data.id}`);
    } else {
      setError(data.error);
      setSaving(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div id="map-container" className={styles.map} />

      {/* Sidebar */}
      <div className={styles.sidebar}>
        {!claiming ? (
          <>
            <div className={styles.sideHead}>
              <h2 className={styles.sideTitle}>
                {spots.length} spot{spots.length !== 1 ? "s" : ""} claimed
              </h2>
              <p className="small muted" style={{ marginTop: 4 }}>
                Click any pin to read that person's journal.
              </p>
            </div>
            <div className={styles.spotList}>
              {spots.map((s) => (
                <Link key={s.id} href={`/spot/${s.id}`} className={styles.spotItem}>
                  <div className={styles.spotDot} />
                  <div>
                    <div className={styles.spotName}>{s.name}</div>
                    <div className="tiny muted">
                      {s.user.displayName} · {s._count.entries} entries
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className={styles.sideFooter}>
              <button
                className="btn btn--primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => setClaiming(true)}
              >
                + claim a spot
              </button>
            </div>
          </>
        ) : (
          <div className={styles.claimPanel}>
            <button
              className="btn btn--ghost small"
              onClick={() => { setClaiming(false); setPendingLatLng(null); setError(""); }}
              style={{ marginBottom: 20 }}
            >
              ← cancel
            </button>
            <h2 className={styles.sideTitle} style={{ marginBottom: 8 }}>Claim a spot</h2>
            <p className="small muted" style={{ marginBottom: 20 }}>
              Click anywhere on the campus map to place your pin, then give it a name.
            </p>
            {pendingLatLng ? (
              <div className="notice notice--success small" style={{ marginBottom: 16 }}>
                Pin placed at {pendingLatLng.lat.toFixed(5)}, {pendingLatLng.lng.toFixed(5)}<br />
                Click the map again to move it.
              </div>
            ) : (
              <div className="notice notice--info small" style={{ marginBottom: 16 }}>
                Click the map to drop your pin.
              </div>
            )}
            <div className="field" style={{ marginBottom: 14 }}>
              <label className="label">Name your spot</label>
              <input
                type="text"
                value={spotName}
                onChange={(e) => setSpotName(e.target.value)}
                placeholder="e.g. Baker-Berry steps, east entrance"
              />
              <span className="helper">Be specific — describe exactly where it is.</span>
            </div>
            {error && (
              <div className="notice notice--error small" style={{ marginBottom: 14 }}>
                {error}
              </div>
            )}
            <button
              className="btn btn--primary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={!pendingLatLng || !spotName.trim() || saving}
              onClick={claimSpot}
            >
              {saving ? "Claiming…" : "Claim this spot"}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(29,158,117,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(29,158,117,0); }
        }
      `}</style>
    </div>
  );
}
