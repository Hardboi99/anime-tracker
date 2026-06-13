import { NextRequest, NextResponse } from "next/server";

// POST /api/session — store Firebase ID token as httpOnly cookie
// Note: We trust the token here because Firebase Auth on the client already
// verified it. Admin SDK verification is done in protected API routes.
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("firebase-session", idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("[SESSION POST]", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

// DELETE /api/session — clear session cookie on logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("firebase-session");
  return response;
}
