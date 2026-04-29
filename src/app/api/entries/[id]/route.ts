// src/app/api/entries/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const EDIT_WINDOW_HOURS = 48;

// PATCH /api/entries/:id — edit entry body within 48-hour window
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth() as any;
    const { body } = await req.json();

    if (!body?.trim()) {
      return NextResponse.json({ error: "Body cannot be empty" }, { status: 400 });
    }

    const entry = await prisma.entry.findUnique({
      where: { id: params.id },
      include: { spot: { include: { term: true } } },
    });

    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (entry.userId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (entry.spot.term.status !== "active") {
      return NextResponse.json(
        { error: "This term has ended — entries can no longer be edited." },
        { status: 403 }
      );
    }

    // 48-hour edit window (admins exempt)
    if (user.role !== "admin") {
      const hoursSinceCreation =
        (Date.now() - new Date(entry.createdAt).getTime()) / 3600000;
      if (hoursSinceCreation > EDIT_WINDOW_HOURS) {
        return NextResponse.json(
          { error: `Entries can only be edited within ${EDIT_WINDOW_HOURS} hours of posting.` },
          { status: 403 }
        );
      }
    }

    const updated = await prisma.entry.update({
      where: { id: params.id },
      data: { body: body.trim() },
      include: { media: true },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Please sign in" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/entries/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth() as any;

    const entry = await prisma.entry.findUnique({
      where: { id: params.id },
      include: { spot: { include: { term: true } } },
    });
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isAdmin = user.role === "admin";
    const isOwner = entry.userId === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.entry.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Please sign in" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
