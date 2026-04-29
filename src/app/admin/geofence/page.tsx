"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./geofence.module.css";

const DEFAULT_POLYGON = [
  [43.7072, -72.2941], [43.7078, -72.2897], [43.7071, -72.2851],
  [43.7048, -72.2828], [43.7018, -72.2832], [43.6998, -72.2871],
  [43.7005, -72.2924], [43.7030, -72.2952], [43.7058, -72.2951],
];

export default function GeofencePage() {
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const [points, setPoints] = useState<number[][]>(DEFAULT_POLYGON);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function init() {
      const L = (await import("leaflet")).default;
      // Import CSS via link tag to avoid TypeScript CSS module issues
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      leafletRef.current = L;

      const map = L.map("geofence-map").setView([43.7044, -72.2887], 15);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      drawPolygon(L, map, DEFAULT_POLYGON);

      map.on("click", (e: any) => {
        setPoints((prev) => {
          const next = [...prev, [e.latlng.lat, e.latlng.lng]];
          drawPolygon(L, map, next);
          return next;
        });
      });
    }
    init();
    return () => { if (mapRef.current) mapRef.current.remove(); };
  }, []);

  function drawPolygon(L: any, map: any, pts: number[][]) {
    if (polygonRef.current) map.removeLayer(polygonRef.current);
    if (pts.length >= 3) {
      polygonRef.current = L.polygon(pts, {
        color: "#1D9E75", weight: 2, fillColor: "#1D9E75",
        fillOpacity: 0.12, dashArray: "6 4",
      }).addTo(map);
    }
  }

  function undo() {
    setPoints((prev) => {
      const next = prev.slice(0, -1);
      if (leafletRef.current && mapRef.current) drawPolygon(leafletRef.current, mapRef.current, next);
      return next;
    });
  }

  function reset() {
    setPoints(DEFAULT_POLYGON);
    if (leafletRef.current && mapRef.current) drawPolygon(leafletRef.current, mapRef.current, DEFAULT_POLYGON);
  }

  function exportGeoJSON() {
    const coords = [...points, points[0]].map(([lat, lng]) => [lng, lat]);
    const json = JSON.stringify([coords]);
    navigator.clipboard.writeText(json).then(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Geofence editor</h1>
          <p className="small muted">
            Click on the map to add boundary points. Export when done and paste
            into your <code>GEOFENCE_POLYGON</code> environment variable in Vercel.
          </p>
        </div>
        <a href="/admin" className="btn btn--ghost small">← admin</a>
      </div>

      <div className={styles.layout}>
        <div id="geofence-map" className={styles.map} />
        <div className={styles.panel}>
          <div className={styles.section}>
            <div className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Vertices
            </div>
            <div className={styles.coordList}>
              {points.map((p, i) => (
                <div key={i} className={`${styles.coord} mono tiny`}>
                  {p[0].toFixed(5)}, {p[1].toFixed(5)}
                </div>
              ))}
              {points.length < 3 && <div className="tiny faint">Click the map to add points…</div>}
            </div>
          </div>
          <div className={styles.actions}>
            <button className="btn small" onClick={undo} disabled={points.length === 0}>undo last</button>
            <button className="btn small" onClick={reset}>reset to default</button>
          </div>
          <div className={styles.exportSection}>
            <button className="btn btn--primary" style={{ width: "100%", justifyContent: "center" }} onClick={exportGeoJSON} disabled={points.length < 3}>
              {saved ? "Copied to clipboard ✓" : "Copy GeoJSON to clipboard"}
            </button>
            {saved && (
              <p className="small muted" style={{ marginTop: 10, lineHeight: 1.5 }}>
                Paste into <code>GEOFENCE_POLYGON</code> in Vercel environment variables, then redeploy.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
