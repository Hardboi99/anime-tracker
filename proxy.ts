import { NextRequest, NextResponse } from "next/server";

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/watchlist") ||
    pathname.startsWith("/search");

  // Check for Firebase session cookie
  const sessionCookie = req.cookies.get("firebase-session")?.value;

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
