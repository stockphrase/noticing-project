"use client";

import { useEffect, useRef } from "react";

interface Props {
  lat: number;
  lng: number;
}

export default function MiniMap({ lat, lng }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!wrapRef.current || !mapDivRef.current) return;

    async function init() {
      const L = (await import("leaflet")).default;

      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!mapDivRef.current) return;

      const map = L.map(mapDivRef.current, {
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        attributionControl: false,
      }).setView([lat, lng], 17);

      mapRef.current = map;

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

      // Size the map div to match the wrapper, then invalidate
      function resize() {
        if (!wrapRef.current || !mapDivRef.current) return;
        const h = wrapRef.current.clientHeight;
        const w = wrapRef.current.clientWidth;
        mapDivRef.current.style.width = w + "px";
        mapDivRef.current.style.height = h + "px";
        map.invalidateSize();
      }

      resize();
      setTimeout(resize, 100);
      setTimeout(resize, 500);

      const ro = new ResizeObserver(resize);
      if (wrapRef.current) ro.observe(wrapRef.current);

      return () => ro.disconnect();
    }

    init();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng]);

  return (
    <div ref={wrapRef} style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <div ref={mapDivRef} />
    </div>
  );
}
