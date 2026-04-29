// src/app/api/terms/active/route.ts
// Returns the currently active term (if any). Public — used by the map.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const term = await prisma.term.findFirst({ where: { status: "active" } });
  if (!term) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(term);
}
