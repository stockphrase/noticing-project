// src/app/api/entries/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { MEDIA_LIMITS } from "@/lib/cloudinary";

// GET /api/entries?spotId=xxx
export async function GET(req: NextRequest) {
  const spotId = req.nextUrl.searchParams.get("spotId");
  if (!spotId) {
    return NextResponse.json({ error: "spotId required" }, { status: 400 });
  }

  const entries = await prisma.entry.findMany({
    where: { spotId },
    include: { media: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(entries);
}

// POST /api/entries
// Create a new noticing entry with optional media URLs.
// Media has already been uploaded to Cloudinary client-side;
// we only receive and store the resulting URLs and publicIds.
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { body: text, spotId, media } = body;

    if (!text?.trim() || !spotId) {
      return NextResponse.json({ error: "Missing body or spotId" }, { status: 400 });
    }

    // Verify the spot belongs to this user
    const spot = await prisma.spot.findUnique({
      where: { id: spotId },
      include: { term: true },
    });
    if (!spot || spot.userId !== (user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify term is still active (no posting to archived terms)
    if (spot.term.status === "archived") {
      return NextResponse.json(
        { error: "This term has ended. Journals are now read-only." },
        { status: 403 }
      );
    }

    // Validate media limits
    const images = (media ?? []).filter((m: any) => m.type === "image");
    const audios = (media ?? []).filter((m: any) => m.type === "audio");
    const videos = (media ?? []).filter((m: any) => m.type === "youtube" || m.type === "url");

    if (images.length > MEDIA_LIMITS.photosPerEntry) {
      return NextResponse.json(
        { error: `Maximum ${MEDIA_LIMITS.photosPerEntry} photos per entry` },
        { status: 400 }
      );
    }
    if (audios.length > 1) {
      return NextResponse.json({ error: "Maximum 1 audio clip per entry" }, { status: 400 });
    }
    if (videos.length > 1) {
      return NextResponse.json({ error: "Maximum 1 video per entry" }, { status: 400 });
    }

    // Create entry — timestamp is always set server-side
    const entry = await prisma.entry.create({
      data: {
        body: text.trim(),
        spotId,
        userId: (user as any).id,
        media: {
          create: (media ?? []).map((m: any) => ({
            type: m.type,
            url: m.url,
            publicId: m.publicId ?? null,
          })),
        },
      },
      include: { media: true },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Please sign in" }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
