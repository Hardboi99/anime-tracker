# AniTrack Developer Handbook & Step-by-Step Tutorial

Welcome! If you are new to coding or web development, this handbook is designed for you. It explains how this project works, how the database is connected, and walks you through **every single line of code** in the key files so you can understand the logic and build similar applications yourself.

---

## 📚 1. Core Technologies & Concepts

Before reading the code, let's understand the tools we are using:

### Next.js (with App Router)
Next.js is a framework built on top of **React** (a library for building user interfaces). 
- In standard React, pages are rendered on the user's browser (Client-Side). 
- Next.js allows us to mix **Client Components** (interactive code running in the browser) and **Server Components/API Routes** (secure code running on a server).
- Next.js uses folders to define routes. For example:
  - `app/login/page.tsx` becomes `http://localhost:3000/login`
  - `app/api/watchlist/route.ts` becomes the API endpoint `http://localhost:3000/api/watchlist`

### Firebase (Authentication & Firestore)
Firebase is a suite of backend cloud services provided by Google:
1. **Firebase Authentication**: Handles signing users in (managing accounts, encrypting passwords, and providing Google Sign-In popups).
2. **Cloud Firestore**: A NoSQL cloud database. Unlike traditional SQL databases that use tables and rows, Firestore stores data as **Documents** (JSON-like objects) organized inside **Collections** (folders of documents).
   - In this project, we have a `users` collection.
   - Inside each user document (identified by their unique User ID), we have a subcollection called `watchlist`.
   - Each item in the `watchlist` is a document containing details about a specific tracked anime.

### Firebase Client SDK vs. Firebase Admin SDK
- **Client SDK (`firebase/ts`)**: Runs in the user's browser. It is public and is used to launch the Google Sign-in popup or send email/password credentials to Firebase.
- **Admin SDK (`firebase-admin`)**: Runs strictly on our backend server (Next.js API routes). It has full access to our database. It uses a private JSON key (Service Account Key) to authenticate securely. Clients never see this key.

### Jikan API (MyAnimeList)
Jikan is a free, open-source API that scrapes MyAnimeList. We make HTTP `GET` requests to retrieve anime descriptions, images, titles, and genres without needing any authorization token or key.

---

## 🔄 2. Main Project Flow (Data & Actions)

Here is what happens step-by-step when a user interacts with the app:

```
[Browser Client]                                              [Next.js Server]                   [Firebase & Jikan APIs]
       │                                                             │                                      │
       ├─► 1. Sign In (via Email or Google popup) ───────────────────┼─────────────────────────────────────►│ (Firebase Auth)
       │◄── Auth Success (returns User ID Token) ────────────────────┼──────────────────────────────────────┤
       │                                                             │                                      │
       ├─► 2. POST /api/session (Save ID Token in httpOnly Cookie) ─►│                                      │
       │◄── Cookie Set ──────────────────────────────────────────────┤                                      │
       │                                                             │                                      │
       ├─► 3. Go to /search (Type "Naruto") ─────────────────────────┼─────────────────────────────────────►│ (Jikan API)
       │◄── Returns list of Anime matching query ────────────────────┼──────────────────────────────────────┤
       │                                                             │                                      │
       ├─► 4. Click "+ Watchlist" (Sends POST /api/watchlist) ──────►├─► Validate session cookie            │
       │                                                             ├─► Add to Firestore users subcol ────►│ (Firestore)
       │◄── Returns Success ─────────────────────────────────────────┤                                      │
       │                                                             │                                      │
       ├─► 5. Go to /watchlist (Loads Watchlist Page) ───────────────►├─► Query user's subcol ──────────────►│ (Firestore)
       │                                                             │◄─ Returns flat records ──────────────┤
       │                                                             ├─► Maps flat data to nested format    │
       │◄── Renders Watchlist items ─────────────────────────────────┤                                      │
       │                                                             │                                      │
       ├─► 6. Click "+" Button (Optimistic Episode Update) ──────────┼──────────────────────────────────────┤
       │    (Instantly increments UI episode count)                  │                                      │
       ├─► Sends PATCH /api/watchlist ──────────────────────────────►├─► Update currentEpisode in DB ──────►│ (Firestore)
       │◄── Returns Updated Data (confirming success) ───────────────┤                                      │
```

---

## 📄 3. Detailed Line-by-Line Code Explanation

Let's dissect the core files of the application.

---

### File 1: `proxy.ts` (Next.js Routing Middleware)
Next.js uses this file to intercept requests and protect private pages from logged-out users.

```typescript
import { NextRequest, NextResponse } from "next/server";

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl; // Extract the requested path (e.g. /dashboard)

  // Define routes that require authentication or routes that are only for guest users
  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/watchlist") ||
    pathname.startsWith("/search");

  // Read the secure cookie containing the Firebase session token
  const sessionCookie = req.cookies.get("firebase-session")?.value;

  // If trying to access a protected page but not logged in -> redirect to login page
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If already logged in but trying to access login/signup -> redirect to dashboard
  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Allow the request to proceed normally
  return NextResponse.next();
}

// Configures Next.js to run this middleware on all routes except static assets & API routes
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

---

### File 2: `lib/firebase-admin.ts` (Server Database Credentials Setup)
This file securely boots up the Firebase Admin SDK on the server using environment variables.

```typescript
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App;

function getAdminApp(): App {
  // If the Admin SDK is already initialized, reuse the existing instance
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Otherwise, initialize the Admin App using credentials from our private .env variables
  adminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      // Replace raw character representations of "\n" with actual newlines for the RSA key
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });

  return adminApp;
}

// Export Auth and Firestore helpers initialized with the admin app
export const adminAuth = getAuth(getAdminApp());
export const adminDb = getFirestore(getAdminApp());
```

---

### File 3: `app/api/watchlist/route.ts` (Watchlist Database Endpoint)
This API endpoint processes HTTP requests (`GET`, `POST`, `PATCH`, `DELETE`) to alter or retrieve the user's watchlist in Cloud Firestore.

#### Token Validation Helper:
```typescript
async function getUserId(req: NextRequest): Promise<string | null> {
  try {
    // Read the session token from cookies or authorization header
    const token =
      req.cookies.get("firebase-session")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return null;

    // Use Firebase Admin to verify if the token is valid and extract the User ID (uid)
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null; // Return null if verification fails
  }
}
```

#### GET Endpoint (Retrieving watchlist items):
```typescript
export async function GET(req: NextRequest) {
  try {
    const uid = await getUserId(req);
    // Return a 401 Unauthorized JSON error if the user is not authenticated
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch all documents inside the subcollection users/{uid}/watchlist/
    const snapshot = await adminDb
      .collection("users")
      .doc(uid)
      .collection("watchlist")
      .orderBy("updatedAt", "desc") // Order by the date they were updated (most recent first)
      .get();

    // Transform flat document fields into the nested format expected by the frontend
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

    return NextResponse.json(watchlist); // Respond with the mapped watchlist array
  } catch (err: any) {
    console.error("Error in GET /api/watchlist:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch watchlist" }, { status: 500 });
  }
}
```

#### POST Endpoint (Adding anime to watchlist):
```typescript
export async function POST(req: NextRequest) {
  try {
    const uid = await getUserId(req);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Parse the JSON request body
    const { animeId, title, image, episodes, genres, rating, status } =
      await req.json();

    if (!animeId) {
      return NextResponse.json({ error: "animeId is required" }, { status: 400 });
    }

    // Access the user's specific anime document path
    const docRef = adminDb
      .collection("users")
      .doc(uid)
      .collection("watchlist")
      .doc(String(animeId));

    const existing = await docRef.get();

    if (existing.exists) {
      // If already added, just update its tracking status
      await docRef.update({
        status: status || "PLAN_TO_WATCH",
        updatedAt: FieldValue.serverTimestamp(), // Firestore database server time
      });
    } else {
      // Otherwise, initialize the fields for the new anime document
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
```

#### PATCH Endpoint (Updating Status/Episodes):
```typescript
export async function PATCH(req: NextRequest) {
  try {
    const uid = await getUserId(req);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { status, currentEpisode, userRating } = body;
    // Align with both client formats ('animeId' or 'id')
    const animeId = body.animeId || body.id;

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

    // Construct the payload dynamically depending on what parameters were sent
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
```

#### DELETE Endpoint (Deleting item from watchlist):
```typescript
export async function DELETE(req: NextRequest) {
  try {
    const uid = await getUserId(req);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Extract the ID from the search query URL (e.g. /api/watchlist?id=21)
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
```

---

### File 4: `app/(app)/watchlist/page.tsx` (Watchlist User Interface & Optimistic Updates)
This file renders your watchlist dashboard card list. Let's analyze how **Optimistic Updates** are written to make the buttons click lightning-fast:

```typescript
  async function updateEpisode(entry: WatchlistEntry, delta: number) {
    const originalEpisode = entry.currentEpisode; // Save current state in case we need to roll back
    // Calculate new count within bounds (don't exceed total episodes or drop below 0)
    const newEp = entry.anime.episodes > 0 
      ? Math.min(entry.anime.episodes, Math.max(0, originalEpisode + delta))
      : Math.max(0, originalEpisode + delta);

    if (newEp === originalEpisode) return; // Do nothing if there's no change

    // 🌟 OPTIMISTIC STEP: Instantly update the local React state before triggering fetch!
    setWatchlist((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, currentEpisode: newEp } : e))
    );

    try {
      // Send the request to update the database in the background
      const res = await fetch("/api/watchlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id, currentEpisode: newEp }),
      });
      if (!res.ok) {
        throw new Error("Failed to save episode progress");
      }
      const updated = await res.json();
      
      // Update with final data returned from server to make sure it is in sync
      setWatchlist((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, currentEpisode: updated.currentEpisode ?? newEp } : e))
      );
    } catch (err) {
      console.error("Failed to update episode progress:", err);
      // 🌟 FAILURE ROLLBACK STEP: If backend fails, revert the state to what it was!
      setWatchlist((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, currentEpisode: originalEpisode } : e))
      );
    }
  }
```

---

## 💡 4. Chrome Extension Architecture & Development

The Chrome Extension allows automated progress tracking when users watch episodes on third-party video players.

### File 1: `extension/manifest.json` (Configuration)
The manifest file tells Google Chrome what permissions our extension requires and which scripts to execute.
```json
{
  "manifest_version": 3,
  "name": "AniTrack",
  "version": "1.0",
  "description": "Automatically track your anime progress on streaming websites.",
  "permissions": [
    "activeTab",
    "notifications",
    "storage"
  ],
  "icons": {
    "128": "icons/icon128.png"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icons/icon128.png"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ]
}
```
* **manifest_version**: Tells Chrome we are using Manifest V3 (the current extension standard).
* **permissions**: `"activeTab"` lets us query the current page's URL. `"notifications"` enables showing desktop push alerts.
* **content_scripts**: Runs `content.js` inside the context of any page matching the list (here, `<all_urls>`).

### File 2: `extension/content.js` (DOM Analysis & Video Listeners)
This script runs in the context of the webpage the user is viewing. It detects HTML5 video tags and calculates playback.
```javascript
// Scan for video elements periodically to catch dynamic loads
const scanInterval = setInterval(scanForVideo, 1000);

function scanForVideo() {
  const video = document.querySelector("video");
  if (video && !videoDetected) {
    videoDetected = true;
    observedVideo = video;
    setupVideoListeners(video);
  }
}
```
* **Episode Completion**: Listens to the `timeupdate` event on the video and sends a message to the background service worker once it crosses $80\%$ completion:
  ```javascript
  const progress = Math.round((currentTime / duration) * 100);
  if (progress >= 80 && !completedLogged) {
    completedLogged = true;
    chrome.runtime.sendMessage({
      type: "PROGRESS_UPDATE",
      data: { animeName, episode, progress }
    });
  }
  ```

### File 3: `extension/background.js` (Background Service Worker)
Because browser security policies (CORS) block scripts inside web pages from talking to other websites, the extension background service worker handles all remote API requests.
* **Jikan API Caching**: Caches anime lookups in memory to prevent exceeding the Jikan API's request limits.
* **Server Cookie Syncing**: Uses `credentials: 'include'` when fetching `localhost:3000/api/progress` to automatically include the user's logged-in Firebase session cookies.
* **Auto-Watchlist Ingestion**: If the server returns `404` (anime not tracked yet), it POSTs to `/api/watchlist` to automatically add it to the user's watchlist before syncing the episode progress.
* **Chrome Notifications**:
  ```javascript
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "AniTrack Watch Sync",
    message: `Episode ${episode} of ${title} completed! 🎉`
  });
  ```

---

## 💡 5. How to Build Your Own Project Next Time

If you want to construct your own web application and browser extension from scratch, follow this exact workflow:

1. **Ideation & Mocking**:
   - Write down the features you want (e.g. "I want to track books", "I want to log tasks").
   - Sketch how the pages should look.
2. **Setup the Database**:
   - Create a project on the [Firebase Console](https://console.firebase.google.com/).
   - Initialize a Firestore Database and set up Security Rules.
3. **Configure Authentication**:
   - Turn on providers (Email/Password, Google, GitHub, etc.) inside Firebase Authentication settings.
4. **Boot your Frontend**:
   - Run `npx create-next-app@latest` to start a blank Next.js project.
   - Install database dependencies: `npm install firebase firebase-admin`.
5. **Establish API Endpoints**:
   - Create route files (`app/api/.../route.ts`) to handle save, load, update, and delete actions in Firestore.
6. **Code Client Components**:
   - Build stateful pages using `useState` and `useEffect` to trigger database requests and paint the UI beautifully.
7. **Perform Optimizations**:
   - Convert standard button click handlers to use **Optimistic Updates** so clicking them feels satisfyingly instant.
   - Polish styles with CSS transitions and `:active` scaling.
8. **Create the Browser Extension**:
   - Declare your Manifest V3 config file.
   - Inject a content script to monitor browser tabs and DOM trees.
   - Create a background service worker to fetch APIs and execute native desktop operations.

