# Anime Tracker (AniTrack) — Developer Guide & Project Documentation

Welcome to **AniTrack**, a modern web application for searching, tracking, and analyzing your anime watchlist. This document provides a step-by-step guide to the architecture, database configurations, project flows, and optimizations of the application.

---

## 🚀 Tech Stack Overview
1. **Frontend Framework**: [Next.js 16.2.9](https://nextjs.org/) (utilizing App Router and React 19).
2. **Styling**: Modern Vanilla CSS (`app/globals.css`) with curated dark-mode styling, glassmorphism card designs, and button animations.
3. **Client Authentication**: Firebase Client SDK (`firebase/auth`).
4. **Backend/Server Operations**: Next.js API Routes + Firebase Admin SDK (`firebase-admin`).
5. **Database**: Google Cloud Firestore (NoSQL Document Store).
6. **Data Source**: Unofficial MyAnimeList API — [Jikan API v4](https://docs.api.jikan.moe/) (No authentication or API keys required).
7. **Data Visualizations**: Recharts (`recharts`) for dashboard stat widgets and SVGs.

---

## 🔑 Database & Auth Setup

### 1. Firestore Database Instance
- Initialized Firestore under the **`(default)`** instance in native mode.
- Deployed Firebase Security Rules that restrict database read/write permissions so that users can only modify their own watchlist document subcollections:
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        match /watchlist/{animeId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  }
  ```
- Deployed composite indexes (`firestore.indexes.json`) to enable compound queries like ordering watchlists by date or filtering by status.

### 2. Authentication Flow
- **Email/Password**: Users can sign up and sign in using email-password credentials.
- **Google Sign-In**: Powered by Firebase Popup Authentication (`signInWithPopup`). For this to work in production and development:
  1. Google authentication provider is enabled in Firebase Console.
  2. `localhost` is listed as an **Authorized Domain** under Firebase Authentication Settings.
  3. OAuth Consent Screen is configured in Google Cloud Console.

---

## 🛠️ Step-by-Step Architecture & Project Flow

Below is the chronological path of data and routing in AniTrack:

### 1. Routing & Route Protection (`middleware.ts`)
When a user navigates to the application, Next.js Middleware automatically runs:
- **Protected Routes** (`/dashboard`, `/watchlist`, `/search`): Checked for the presence of the `firebase-session` session cookie. If missing, the user is redirected to `/login`.
- **Authentication Routes** (`/login`, `/signup`): Checked for the presence of the cookie. If logged in, users are automatically redirected to `/dashboard`.

### 2. Session Management (`app/api/session/route.ts`)
- Once client-side Firebase Auth completes (e.g. sign-in with email or Google), the client sends the user ID token to `/api/session`.
- The session route saves the Firebase ID Token as an `httpOnly`, `secure`, and `sameSite: strict` cookie named `firebase-session` so it can be checked in subsequent server requests and middleware.

### 3. Anime Discovery (`app/(app)/search/page.tsx`)
- On mount, the page makes a GET request to the Jikan API `https://api.jikan.moe/v4/top/anime?limit=12` to showcase the top trending anime.
- When search is triggered, it requests `https://api.jikan.moe/v4/anime?q={query}` to fetch matches.
- Clicking **"+ Watchlist"** triggers a `POST` request to `/api/watchlist` to save the anime to the user's database.

### 4. Database CRUD & Schema Mappings (`app/api/watchlist/route.ts`)
All server actions in Next.js interact securely with Firestore:
- **`POST`**: Adds or updates an anime document inside the subcollection `users/{uid}/watchlist/{animeId}`. The anime is saved with fields: `animeId`, `title`, `image`, `episodes`, `genres`, `rating`, `status`, `currentEpisode`, and server timestamps.
- **`GET`**: Fetches the user's watchlist ordered by update time. Since Firestore stores fields flatly (e.g. `title` at the root document), the endpoint maps these fields to a nested `{ anime: { title, image, episodes, genres } }` object before responding, matching the client-side expectations.
- **`PATCH`**: Modifies the watch status, rating, or current episode. It is robust to support requests sending either `animeId` or `id` in the body.
- **`DELETE`**: Removes the anime document from Firestore. Supports both `animeId` and `id` query parameters.

### 5. Watchlist Management (`app/(app)/watchlist/page.tsx`)
- Fetches all tracking items.
- Provides filtration buttons (`All`, `Watching`, `Completed`, `Dropped`, `Plan to Watch`).
- **Snappy Updates**: Features optimistic updates. Clicking `+` or `-` to change episode count immediately changes the state locally. The backend request runs in the background. If it fails, the application rolls back the local state to the original episode count.

### 6. Personal Analytics (`app/(app)/dashboard/page.tsx`)
- Reads the watchlist data.
- Dynamically computes user stats (e.g. total episodes watched, count per status).
- Maps genre frequencies, sorting and rendering the top 8 genres in a dynamic vertical bar chart.
- Renders a responsive status distribution pie chart using Recharts.

---

## ⚡ Key Optimizations & Bug Fixes Done

1. **Firestore Setup & Rules**: Resolved database connection failures (`5 NOT_FOUND`) by creating the Firestore instance and deploying security rules/indexes via the CLI.
2. **Optimistic Updates**: Solved button input lags (making `+` and `-` clicks instant). The UI increments/decrements the episode count instantly in React state without waiting for a database roundtrip.
3. **Physical Pressed Animations**: Added a scaling transition (`transform: scale(0.9);` on `:active` clicks) to the `.episode-btn` class in CSS, providing responsive physical/mechanical feedback.
4. **Data Structure Unification**: Aligned the client-side UI data models with Firestore database schemas by transforming database records into nested objects inside the server API layer.
5. **Secure Route Gatekeeping**: Re-implemented and renamed the route security middleware to `middleware.ts` (moving from `proxy.ts`), correctly protecting dashboard pages from unauthorized access.
6. **Error Wrapping**: Wrapped all Next.js API routes in try-catch handlers to yield clean JSON error codes (like `400` or `500`) instead of crashing the Next.js dev server with unhandled parser rejections.

---

## 🏃 Run Locally

### Prerequisites
Create a `.env` file in the root folder with client & admin configurations:
```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"

FIREBASE_ADMIN_PROJECT_ID="your-project-id"
FIREBASE_ADMIN_CLIENT_EMAIL="firebase-adminsdk-...@your-project.iam.gserviceaccount.com"
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.
