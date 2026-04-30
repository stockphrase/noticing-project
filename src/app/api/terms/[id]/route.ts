// src/app/api/terms/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// PATCH /api/terms/:id
// Actions: { action: "activate" | "archive" }
// activate — sets this term to active, marks any other active term as archived
// archive  — closes the term; all journals become read-only
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { action } = await req.json();

    if (action === "activate") {
      // Deactivate any currently active term first
      await prisma.term.updateMany({
        where: { status: "active" },
        data: { status: "archived", archivedAt: new Date() },
      });
      const term = await prisma.term.update({
        where: { id: (await params).id },
        data: { status: "active", startedAt: new Date() },
      });
      return NextResponse.json(term);
    }

    if (action === "archive") {
      const term = await prisma.term.update({
        where: { id: (await params).id },
        data: { status: "archived", archivedAt: new Date() },
      });
      return NextResponse.json(term);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    if (err.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/terms/:id
// Hard-deletes a term and ALL associated spots, entries, and media.
// Only allowed on draft terms (not yet activated).
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const term = await prisma.term.findUnique({ where: { id: (await params).id } });
    if (!term) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (term.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft terms can be deleted. Archive active or past terms instead." },
        { status: 400 }
      );
    }
    await prisma.term.delete({ where: { id: (await params).id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
