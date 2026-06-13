import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

async function getUserId(req: NextRequest): Promise<string | null> {
  try {
    const token =
      req.cookies.get("firebase-session")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return null;
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

// POST /api/progress — update episode progress (used by extension too)
export async function POST(req: NextRequest) {
  try {
    const uid = await getUserId(req);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { animeId, episode, progress } = await req.json();

    if (!animeId || episode === undefined) {
      return NextResponse.json(
        { error: "animeId and episode are required" },
        { status: 400 }
      );
    }

    const docRef = adminDb
      .collection("users")
      .doc(uid)
      .collection("watchlist")
      .doc(String(animeId));

    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Anime not in watchlist" },
        { status: 404 }
      );
    }

    const data = doc.data()!;

    // Auto-complete if progress >= 80% and currently watching
    const autoCompleted =
      progress >= 80 &&
      data.status === "WATCHING" &&
      data.status !== "COMPLETED";

    await docRef.update({
      currentEpisode: episode,
      ...(autoCompleted && { status: "COMPLETED" }),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, autoCompleted });
  } catch (err: any) {
    console.error("Error in POST /api/progress:", err);
    return NextResponse.json({ error: err.message || "Failed to update progress" }, { status: 500 });
  }
}
