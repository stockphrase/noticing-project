// src/lib/geofence.ts
// Checks whether a lat/lng point falls inside the campus geofence polygon.
// The polygon is stored in GEOFENCE_POLYGON as a GeoJSON coordinates array.
// GeoJSON uses [lng, lat] order — be careful when passing coordinates.

import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point, polygon } from "@turf/helpers";

export function isInsideCampus(lat: number, lng: number): boolean {
  try {
    const raw = process.env.GEOFENCE_POLYGON;
    if (!raw) {
      // If no geofence is configured, allow all pins (useful during dev)
      console.warn("GEOFENCE_POLYGON not set — allowing all pin placements");
      return true;
    }
    const coordinates = JSON.parse(raw) as number[][][];
    const fence = polygon(coordinates);
    const pt = point([lng, lat]); // GeoJSON is [lng, lat]
    return booleanPointInPolygon(pt, fence);
  } catch (err) {
    console.error("Geofence check failed:", err);
    return false;
  }
}
