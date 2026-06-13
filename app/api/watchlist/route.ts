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

// GET /api/watchlist — get user's watchlist mapped to nested structure
export async function GET(req: NextRequest) {
  try {
    const uid = await getUserId(req);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const snapshot = await adminDb
      .collection("users")
      .doc(uid)
      .collection("watchlist")
      .orderBy("updatedAt", "desc")
      .get();

    const watchlist = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        animeId: data.animeId || Number(doc.id),
        status: data.status || "PLAN_TO_WATCH",
        currentEpisode: data.currentEpisode || 0,
        rating: data.rating || 0,
        userRating: data.userRating || null,
        anime: {
          title: data.title || "",
          image: data.image || "",
          episodes: data.episodes || 0,
          genres: data.genres || [],
        },
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });

    return NextResponse.json(watchlist);
  } catch (err: any) {
    console.error("Error in GET /api/watchlist:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch watchlist" }, { status: 500 });
  }
}

// POST /api/watchlist — add anime to watchlist
export async function POST(req: NextRequest) {
  try {
    const uid = await getUserId(req);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { animeId, title, image, episodes, genres, rating, status } =
      await req.json();

    if (!animeId) {
      return NextResponse.json({ error: "animeId is required" }, { status: 400 });
    }

    const docRef = adminDb
      .collection("users")
      .doc(uid)
      .collection("watchlist")
      .doc(String(animeId));

    const existing = await docRef.get();

    if (existing.exists) {
      // Update status if already in watchlist
      await docRef.update({
        status: status || "PLAN_TO_WATCH",
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      await docRef.set({
        animeId: Number(animeId),
        title: title || "",
        image: image || "",
        episodes: episodes || 0,
        genres: genres || [],
        rating: rating || 0,
        status: status || "PLAN_TO_WATCH",
        currentEpisode: 0,
        userRating: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true, animeId });
  } catch (err: any) {
    console.error("Error in POST /api/watchlist:", err);
    return NextResponse.json({ error: err.message || "Failed to add to watchlist" }, { status: 500 });
  }
}

// PATCH /api/watchlist — update status, episode, or rating
export async function PATCH(req: NextRequest) {
  try {
    const uid = await getUserId(req);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { status, currentEpisode, userRating } = body;
    const animeId = body.animeId || body.id; // supports both formats

    if (!animeId) {
      return NextResponse.json({ error: "animeId or id is required" }, { status: 400 });
    }

    const docRef = adminDb
      .collection("users")
      .doc(uid)
      .collection("watchlist")
      .doc(String(animeId));

    const updateData: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (status !== undefined) updateData.status = status;
    if (currentEpisode !== undefined) updateData.currentEpisode = currentEpisode;
    if (userRating !== undefined) updateData.userRating = userRating;

    await docRef.update(updateData);

    return NextResponse.json({ success: true, status, currentEpisode, userRating });
  } catch (err: any) {
    console.error("Error in PATCH /api/watchlist:", err);
    return NextResponse.json({ error: err.message || "Failed to update watchlist" }, { status: 500 });
  }
}

// DELETE /api/watchlist?animeId=... — remove from watchlist
export async function DELETE(req: NextRequest) {
  try {
    const uid = await getUserId(req);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const animeId = req.nextUrl.searchParams.get("animeId") || req.nextUrl.searchParams.get("id");
    if (!animeId) {
      return NextResponse.json({ error: "animeId or id is required" }, { status: 400 });
    }

    await adminDb
      .collection("users")
      .doc(uid)
      .collection("watchlist")
      .doc(String(animeId))
      .delete();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error in DELETE /api/watchlist:", err);
    return NextResponse.json({ error: err.message || "Failed to delete from watchlist" }, { status: 500 });
  }
}
