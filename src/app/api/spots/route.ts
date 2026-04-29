// src/app/api/spots/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { isInsideCampus } from "@/lib/geofence";

// GET /api/spots?termId=xxx
// Returns all spots for a term, with entry count and owner info.
export async function GET(req: NextRequest) {
  const termId = req.nextUrl.searchParams.get("termId");

  const where = termId ? { termId } : {};

  const spots = await prisma.spot.findMany({
    where,
    include: {
      user: { select: { displayName: true, username: true } },
      _count: { select: { entries: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(spots);
}

// POST /api/spots
// Claim a new spot. Validates geofence and checks no duplicate pin is too close.
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { name, lat, lng, termId } = body;

    if (!name || !lat || !lng || !termId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Geofence check
    if (!isInsideCampus(lat, lng)) {
      return NextResponse.json(
        { error: "This spot is outside the campus boundary. Please choose a location on the Dartmouth campus." },
        { status: 422 }
      );
    }

    // Check the term is active
    const term = await prisma.term.findUnique({ where: { id: termId } });
    if (!term || term.status !== "active") {
      return NextResponse.json({ error: "No active term" }, { status: 400 });
    }

    // Check user doesn't already have a spot this term
    const existing = await prisma.spot.findFirst({
      where: { userId: (user as any).id, termId },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already have a spot this term. Each person may claim one spot per term." },
        { status: 409 }
      );
    }

    // Proximity check — reject if another spot is within ~10 meters
    // (Uses simple degree-based approximation; precise enough at campus scale)
    const nearby = await prisma.spot.findFirst({
      where: {
        termId,
        lat: { gte: lat - 0.0001, lte: lat + 0.0001 },
        lng: { gte: lng - 0.0001, lte: lng + 0.0001 },
      },
    });
    if (nearby) {
      return NextResponse.json(
        { error: "Another spot has already been claimed very close to this location. Please choose a different spot." },
        { status: 409 }
      );
    }

    const spot = await prisma.spot.create({
      data: { name, lat, lng, termId, userId: (user as any).id },
      include: { user: { select: { displayName: true, username: true } } },
    });

    return NextResponse.json(spot, { status: 201 });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Please sign in" }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
