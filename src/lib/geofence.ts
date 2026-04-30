// src/lib/geofence.ts
// Checks whether a lat/lng point falls inside the campus geofence polygon.
// Uses a simple ray-casting algorithm — no external dependencies needed.
// GeoJSON polygon coordinates are [lng, lat] order.

function pointInPolygon(lat: number, lng: number, polygon: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1]; // lng, lat
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isInsideCampus(lat: number, lng: number): boolean {
  try {
    const raw = process.env.GEOFENCE_POLYGON;
    if (!raw) {
      console.warn("GEOFENCE_POLYGON not set — allowing all pin placements");
      return true;
    }
    // GeoJSON format: [[[lng, lat], [lng, lat], ...]]
    const coordinates = JSON.parse(raw) as number[][][];
    const ring = coordinates[0]; // outer ring
    return pointInPolygon(lat, lng, ring);
  } catch (err) {
    console.error("Geofence check failed:", err);
    return false;
  }
}
