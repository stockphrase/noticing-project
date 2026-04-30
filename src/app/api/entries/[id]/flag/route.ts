// src/app/api/entries/[id]/flag/route.ts
// Students can flag an entry for instructor review.
// One flag per user per entry.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth() as any;
    const { reason } = await req.json();

    const existing = await prisma.flag.findFirst({
      where: { entryId: (await params).id, flaggedBy: user.id },
    });
    if (existing) {
      return NextResponse.json({ error: "Already flagged" }, { status: 409 });
    }

    const flag = await prisma.flag.create({
      data: { entryId: (await params).id, flaggedBy: user.id, reason },
    });
    return NextResponse.json(flag, { status: 201 });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Please sign in" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
