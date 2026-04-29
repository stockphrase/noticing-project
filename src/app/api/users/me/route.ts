// src/app/api/users/me/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json(null, { status: 401 });
  return NextResponse.json(session.user);
}
