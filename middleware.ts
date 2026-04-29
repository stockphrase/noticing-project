import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const protectedPaths = ["/map", "/new-noticing", "/browse"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAdmin = pathname.startsWith("/admin");

  if (!isProtected && !isAdmin) return NextResponse.next();

  // NextAuth v5 beta uses __Secure-authjs.session-token in production
  // and authjs.session-token in development
  const sessionToken =
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("authjs.session-token")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For admin routes we can't easily check the role in middleware
  // without decrypting the JWT — so we let the page handle it
  // (admin/page.tsx already redirects non-admins)
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",],
};
