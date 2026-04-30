"use client";
// src/components/MiniMap.tsx
// Small read-only map showing the spot location on the journal page.

import { useEffect, useRef } from "react";

interface Props {
  lat: number;
  lng: number;
}

export default function MiniMap({ lat, lng }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let map: any;

    async function init() {
      const L = (await import("leaflet")).default;

      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!ref.current) return;

      map = L.map(ref.current, {
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        attributionControl: false,
      }).setView([lat, lng], 17);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: '<div style="width:14px;height:14px;border-radius:50%;background:#1D9E75;border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      L.marker([lat, lng], { icon }).addTo(map);
    }

    init();
    return () => { if (map) map.remove(); };
  }, [lat, lng]);

  return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
}
