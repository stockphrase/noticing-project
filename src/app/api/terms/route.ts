// src/app/api/terms/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/terms — list all terms (admin only)
export async function GET() {
  try {
    await requireAdmin();
    const terms = await prisma.term.findMany({
      include: {
        _count: { select: { spots: true, enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(terms);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

// POST /api/terms — create a new term (admin only)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Term name required" }, { status: 400 });
    }
    const term = await prisma.term.create({
      data: { name: name.trim() },
    });
    return NextResponse.json(term, { status: 201 });
  } catch (err: any) {
    if (err.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
