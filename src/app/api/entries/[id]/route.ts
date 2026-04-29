// src/app/api/entries/[id]/route.ts
// Delete a single entry. Admin can delete any entry; students can only
// delete their own entries in an active term.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
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
    const termActive = entry.spot.term.status === "active";

    if (!isAdmin && (!isOwner || !termActive)) {
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
