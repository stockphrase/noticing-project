// src/app/api/admin/whitelist/route.ts
// Admin-only. Manages the email whitelist for registration.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/whitelist
// Returns all whitelisted emails.
export async function GET() {
  try {
    await requireAdmin();
    const list = await prisma.whitelist.findMany({
      orderBy: { addedAt: "desc" },
    });
    return NextResponse.json(list);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

// POST /api/admin/whitelist
// Bulk-add emails from a pasted list. Accepts { emails: string } where
// emails is a raw string of one email per line (copied from CMS).
// Silently skips duplicates and malformed lines.
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { emails } = await req.json();

    if (!emails || typeof emails !== "string") {
      return NextResponse.json({ error: "emails string required" }, { status: 400 });
    }

    // Parse — split on newlines, commas, or semicolons; trim; lowercase; dedupe
    const parsed = [
      ...new Set(
        emails
          .split(/[\n,;]+/)
          .map((e: string) => e.trim().toLowerCase())
          .filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      ),
    ];

    if (parsed.length === 0) {
      return NextResponse.json({ error: "No valid email addresses found" }, { status: 400 });
    }

    // Upsert each email — skip existing entries silently
    const results = await Promise.allSettled(
      parsed.map((email: string) =>
        prisma.whitelist.upsert({
          where: { email },
          update: {},           // already exists — do nothing
          create: { email },
        })
      )
    );

    const added = results.filter((r) => r.status === "fulfilled").length;
    const skipped = results.length - added;

    return NextResponse.json({ added, skipped, total: parsed.length }, { status: 201 });
  } catch (err: any) {
    if (err.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/admin/whitelist
// Remove a single email. Body: { email: string }
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    await prisma.whitelist.delete({
      where: { email: email.trim().toLowerCase() },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // P2025 = record not found in Prisma
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
