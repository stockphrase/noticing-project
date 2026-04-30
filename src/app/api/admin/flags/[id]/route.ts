// src/app/api/admin/flags/[id]/route.ts
// Resolve (dismiss) a flag.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const { action } = await req.json();
    if (action === "resolve") {
      await prisma.flag.update({
        where: { id: (await params).id },
        data: { resolved: true },
      });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    if (err.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
