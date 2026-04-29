// src/app/api/users/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { username, email, displayName, password } = await req.json();

    if (!username || !email || !displayName || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Whitelist check — email must be pre-approved by the instructor
    const normalizedEmail = email.trim().toLowerCase();
    const allowed = await prisma.whitelist.findUnique({
      where: { email: normalizedEmail },
    });
    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "This email address is not on the invitation list. Please use the email your instructor has on file, or contact them to be added.",
        },
        { status: 403 }
      );
    }

    // Check for existing username or email
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing) {
      const field = existing.username === username ? "username" : "email";
      return NextResponse.json(
        { error: `That ${field} is already taken` },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Find the active term and auto-enroll the new student
    const activeTerm = await prisma.term.findFirst({
      where: { status: "active" },
    });

    const user = await prisma.user.create({
      data: {
        username: username.trim().toLowerCase(),
        email: normalizedEmail,
        displayName: displayName.trim(),
        passwordHash,
        enrollments: activeTerm
          ? { create: { termId: activeTerm.id } }
          : undefined,
      },
    });

    return NextResponse.json(
      { id: user.id, username: user.username, displayName: user.displayName },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
