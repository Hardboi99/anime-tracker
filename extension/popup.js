document.addEventListener("DOMContentLoaded", async () => {
  const mainContent = document.getElementById("main-content");
  const connectionDot = document.getElementById("connection-dot");
  const BACKEND_URL = "http://localhost:3000";

  let watchlist = [];
  let activeAnime = null;
  let activeTabHost = null;

  try {
    // 1. Get active tab hostname
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      activeTabHost = new URL(tab.url).hostname.replace("www.", "");
    }

    // 2. Fetch current active anime from storage
    const storage = await chrome.storage.local.get("currentAnime");
    if (storage.currentAnime && storage.currentAnime.hostname === activeTabHost) {
      activeAnime = storage.currentAnime;
    }

    // 3. Connect to AniTrack backend watchlist API
    const res = await fetch(`${BACKEND_URL}/api/watchlist`, {
      credentials: "include" // Send session cookie
    });

    if (res.status === 401) {
      connectionDot.className = "status-dot";
      renderLoginPrompt();
      return;
    }

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    watchlist = await res.json();
    connectionDot.className = "status-dot online"; // Connection OK

    // 4. Render appropriate UI based on active tab matching
    if (activeAnime) {
      renderActiveTracker();
    } else {
      renderGlobalStats();
    }

  } catch (err) {
    console.error("Popup initialization error:", err);
    connectionDot.className = "status-dot";
    renderOfflineWarning();
  }

  // --- UI Rendering Functions ---

  function renderLoginPrompt() {
    mainContent.innerHTML = `
      <div class="card" style="text-align: center;">
        <p style="margin-bottom: 12px;">🔒 You are not signed in.</p>
        <button id="btn-login" class="action-btn">Sign In to AniTrack</button>
      </div>
    `;
    document.getElementById("btn-login").addEventListener("click", () => {
      chrome.tabs.create({ url: `${BACKEND_URL}/login` });
    });
  }

  function renderOfflineWarning() {
    mainContent.innerHTML = `
      <div class="card" style="text-align: center;">
        <p class="warning" style="margin-bottom: 12px;">🔴 Could not connect to AniTrack server.</p>
        <p style="font-size: 11px; color: var(--text-secondary);">Make sure the server is running locally at http://localhost:3000</p>
        <button id="btn-retry" class="action-btn secondary" style="margin-top: 12px;">Retry Connection</button>
      </div>
    `;
    document.getElementById("btn-retry").addEventListener("click", () => {
      window.location.reload();
    });
  }

  function renderGlobalStats() {
    const counts = {
      ALL: watchlist.length,
      WATCHING: watchlist.filter(e => e.status === "WATCHING").length,
      COMPLETED: watchlist.filter(e => e.status === "COMPLETED").length,
      PLAN_TO_WATCH: watchlist.filter(e => e.status === "PLAN_TO_WATCH").length,
    };

    mainContent.innerHTML = `
      <div class="card">
        <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px; font-weight: 600; text-align: center;">📊 Tracking Stats Summary</p>
        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-val">${counts.ALL}</div>
            <div class="stat-lbl">Tracked</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">${counts.WATCHING}</div>
            <div class="stat-lbl">Watching</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">${counts.COMPLETED}</div>
            <div class="stat-lbl">Done</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">${counts.PLAN_TO_WATCH}</div>
            <div class="stat-lbl">Plan</div>
          </div>
        </div>
        <button id="btn-dashboard" class="action-btn" style="margin-top: 14px;">Open Web Dashboard</button>
      </div>
    `;

    document.getElementById("btn-dashboard").addEventListener("click", () => {
      chrome.tabs.create({ url: `${BACKEND_URL}/dashboard` });
    });
  }

  async function renderActiveTracker() {
    // Try to find if this anime matches any entry in the watchlist
    const matchedEntry = watchlist.find(e => 
      e.anime.title.toLowerCase() === activeAnime.title.toLowerCase()
    );

    if (matchedEntry) {
      // Anime is already in the user's watchlist
      mainContent.innerHTML = `
        <div class="card">
          <div class="anime-container">
            <img class="poster" src="${matchedEntry.anime.image || ''}" alt="${matchedEntry.anime.title}" />
            <div class="anime-details">
              <h4 class="anime-title" title="${matchedEntry.anime.title}">${matchedEntry.anime.title}</h4>
              <div class="anime-meta">Status: <span style="color: var(--accent-light); font-weight: 600;">${matchedEntry.status}</span></div>
              
              <div class="controller">
                <button id="btn-dec" class="btn-circle">−</button>
                <div class="count" id="episode-display">Ep ${matchedEntry.currentEpisode}</div>
                <button id="btn-inc" class="btn-circle">+</button>
              </div>
            </div>
          </div>
          
          <div style="margin-top: 10px; font-size: 11px; color: var(--text-secondary); display: flex; justify-content: space-between;">
            <span>Current Stream Progress:</span>
            <span>${activeAnime.progress}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-bar" style="width: ${activeAnime.progress}%"></div>
          </div>
        </div>
      `;

      let currentEp = matchedEntry.currentEpisode;

      // Handle Episode Increment / Decrement
      const updateEpisodeCount = async (delta) => {
        const originalEp = currentEp;
        const totalEps = matchedEntry.anime.episodes;
        
        const newEp = totalEps > 0 
          ? Math.min(totalEps, Math.max(0, originalEp + delta))
          : Math.max(0, originalEp + delta);

        if (newEp === originalEp) return;
        currentEp = newEp;

        // Optimistic UI Update
        document.getElementById("episode-display").textContent = `Ep ${newEp}`;

        try {
          const res = await fetch(`${BACKEND_URL}/api/watchlist`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: matchedEntry.id, currentEpisode: newEp }),
            credentials: "include"
          });
          if (!res.ok) throw new Error("Sync failed");
        } catch (err) {
          console.error("Episode update failed:", err);
          // Rollback
          currentEp = originalEp;
          document.getElementById("episode-display").textContent = `Ep ${originalEp}`;
        }
      };

      document.getElementById("btn-dec").addEventListener("click", () => updateEpisodeCount(-1));
      document.getElementById("btn-inc").addEventListener("click", () => updateEpisodeCount(1));

    } else {
      // Anime is active but not in watchlist yet
      mainContent.innerHTML = `
        <div class="card" style="text-align: center;">
          <p style="font-size: 11px; text-transform: uppercase; color: var(--text-secondary); font-weight: 700; margin-bottom: 8px; letter-spacing: 0.05em;">📡 Active Stream Detected</p>
          <h4 style="font-size: 14px; font-weight: 800; margin: 0 0 12px 0; color: var(--text-primary); word-break: break-word;">${activeAnime.title}</h4>
          <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 16px;">Currently playing Episode ${activeAnime.episode}. Add this to your watchlist to start tracking!</p>
          <button id="btn-add" class="action-btn">⚡ Add to Watchlist</button>
        </div>
      `;

      document.getElementById("btn-add").addEventListener("click", async () => {
        const btn = document.getElementById("btn-add");
        btn.disabled = true;
        btn.textContent = "Adding...";

        try {
          // Resolve Name via Jikan and Add to Watchlist
          const jikanRes = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(activeAnime.title)}&limit=1`);
          const jikanData = await jikanRes.json();
          const anime = jikanData.data?.[0];

          if (anime) {
            const addRes = await fetch(`${BACKEND_URL}/api/watchlist`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                animeId: anime.mal_id,
                title: anime.title,
                image: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
                episodes: anime.episodes || 0,
                genres: anime.genres.map(g => g.name),
                rating: anime.score || 0,
                status: "WATCHING"
              }),
              credentials: "include"
            });

            if (addRes.ok) {
              // Reload popup to display active tracker
              window.location.reload();
              return;
            }
          }
          throw new Error("Failed to add anime");
        } catch (err) {
          console.error("Auto-add failed:", err);
          btn.disabled = false;
          btn.textContent = "Failed. Try Again";
        }
      });
    }
  }
});
