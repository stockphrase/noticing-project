// src/app/api/spots/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const spot = await prisma.spot.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { displayName: true, username: true } },
      _count: { select: { entries: true } },
    },
  });
  if (!spot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(spot);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth() as any;

    const spot = await prisma.spot.findUnique({
      where: { id: params.id },
      include: { term: true },
    });

    if (!spot) {
      return NextResponse.json({ error: "Spot not found" }, { status: 404 });
    }

    // Only the owner can delete their own spot
    if (spot.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can only delete spots in an active term
    if (spot.term.status !== "active") {
      return NextResponse.json(
        { error: "This term has ended — spots can no longer be deleted." },
        { status: 403 }
      );
    }

    // Cascade delete — Prisma deletes all entries and media via onDelete: Cascade
    await prisma.spot.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Please sign in" }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/spots/:id — rename spot (owner only, active term only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth() as any;
    const { name } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }

    const spot = await prisma.spot.findUnique({
      where: { id: params.id },
      include: { term: true },
    });

    if (!spot) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (spot.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (spot.term.status !== "active") {
      return NextResponse.json(
        { error: "This term has ended — spot names can no longer be changed." },
        { status: 403 }
      );
    }

    const updated = await prisma.spot.update({
      where: { id: params.id },
      data: { name: name.trim() },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Please sign in" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
