// AniTrack Background Service Worker
console.log("AniTrack: Background service worker active.");

const BACKEND_URL = "http://localhost:3000";
const animeIdCache = new Map(); // Cache to prevent spamming Jikan API (animeName -> Jikan Data)
const syncedEpisodes = new Set(); // Track synced episodes during the session to avoid duplicate hits

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PROGRESS_UPDATE") {
    handleProgressUpdate(message.data);
  }
});

async function handleProgressUpdate(data) {
  const { animeName, episode, progress } = data;
  const syncKey = `${animeName}-${episode}`;

  // Only sync once when progress crosses the 80% completion mark
  if (progress < 80 || syncedEpisodes.has(syncKey)) {
    return;
  }

  console.log(`AniTrack: Detected completion (80%+) for ${animeName} Ep ${episode}. Syncing...`);
  syncedEpisodes.add(syncKey);

  try {
    // 1. Resolve Anime Name to MAL ID (using cache or Jikan Search)
    const animeData = await getAnimeData(animeName);
    if (!animeData) {
      console.error(`AniTrack: Could not find anime ID for "${animeName}" on Jikan API.`);
      return;
    }

    const animeId = animeData.mal_id;

    // 2. Send progress payload to Backend API
    const syncSuccess = await syncProgress(animeId, episode, progress);

    if (syncSuccess) {
      // 3. Show native Chrome notification on success
      showCompletionNotification(animeName, episode);
    } else {
      // 4. Auto-Add to watchlist if 404 (Not found in watchlist yet)
      console.log(`AniTrack: Anime "${animeName}" not in watchlist. Adding it now...`);
      const addSuccess = await addToWatchlist(animeData);
      
      if (addSuccess) {
        // Retry progress sync
        const retrySuccess = await syncProgress(animeId, episode, progress);
        if (retrySuccess) {
          showCompletionNotification(animeName, episode);
        }
      }
    }
  } catch (error) {
    console.error("AniTrack: Sync failed with error:", error);
    syncedEpisodes.delete(syncKey); // Allow retry on fatal network failure
  }
}

// Resolves Anime Name using Jikan API with memory caching to respect rate limits
async function getAnimeData(animeName) {
  if (animeIdCache.has(animeName)) {
    return animeIdCache.get(animeName);
  }

  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(animeName)}&limit=1`);
    if (!res.ok) throw new Error(`Jikan status ${res.status}`);
    
    const data = await res.json();
    const anime = data.data?.[0];
    
    if (anime) {
      animeIdCache.set(animeName, anime);
      return anime;
    }
    return null;
  } catch (err) {
    console.error("AniTrack: Jikan API lookup failed:", err);
    return null;
  }
}

// Sends progress updates to local Next.js server
async function syncProgress(animeId, episode, progress) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animeId, episode, progress }),
      // CRITICAL: Includes secure firebase-session cookie automatically
      credentials: "include"
    });

    if (res.status === 404) {
      return false; // Signal that it needs to be added to watchlist
    }

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    console.log(`AniTrack: Sync successful for ID ${animeId} Ep ${episode}.`);
    return true;
  } catch (err) {
    console.error("AniTrack: Server sync failed:", err);
    throw err;
  }
}

// Automatically registers anime in watchlist when it is watched
async function addToWatchlist(anime) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/watchlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        animeId: anime.mal_id,
        title: anime.title,
        image: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
        episodes: anime.episodes || 0,
        genres: anime.genres.map(g => g.name),
        rating: anime.score || 0,
        status: "WATCHING" // Auto-set status as currently watching
      }),
      credentials: "include"
    });

    if (!res.ok) {
      throw new Error(`Watchlist POST failed with status ${res.status}`);
    }

    console.log(`AniTrack: Auto-added "${anime.title}" to watchlist.`);
    return true;
  } catch (err) {
    console.error("AniTrack: Failed to auto-add to watchlist:", err);
    return false;
  }
}

// Triggers system desktop notification
function showCompletionNotification(title, episode) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.png", // Configured in manifest
    title: "AniTrack Watch Sync",
    message: `Episode ${episode} of ${title} completed and synced! 🎉`,
    priority: 2
  });
}
