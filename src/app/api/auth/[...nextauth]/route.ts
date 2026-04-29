// src/app/api/auth/[...nextauth]/route.ts
// NextAuth v5 route handler. This single file wires up all auth endpoints:
// POST /api/auth/signin, GET /api/auth/session, POST /api/auth/signout, etc.

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
