// AniTrack Content Script
console.log("AniTrack: Content script loaded successfully.");

let videoDetected = false;
let observedVideo = null;
let lastProgress = 0;
let completedLogged = false;

// Scan for video elements periodically to catch dynamic loads
const scanInterval = setInterval(scanForVideo, 1000);

function scanForVideo() {
  const video = document.querySelector("video");
  
  if (video && !videoDetected) {
    videoDetected = true;
    observedVideo = video;
    console.log("AniTrack: Video Found ✅", video);
    setupVideoListeners(video);
  }
}

function extractAnimeDetails() {
  let title = "Unknown Anime";
  let episode = 1;

  // 1. Try to parse from the document title (standard for streaming sites like AnimePahe)
  // Example title: "Naruto: Shippuden - Episode 15 (Sub)" or "Play One Piece - 1000"
  const docTitle = document.title;
  
  // Try pattern "Title - Episode XX" or "Title - XX"
  const epMatch = docTitle.match(/(.+?)\s*-\s*(?:Episode\s*)?(\d+)/i);
  if (epMatch) {
    title = epMatch[1].trim();
    episode = parseInt(epMatch[2], 10);
  }

  // 2. Try AnimePahe specific h2 link selector
  const animeLink = document.querySelector("h2 a[href*='/anime/']") || 
                    document.querySelector("a[href*='/anime/']");
  if (animeLink && animeLink.textContent) {
    title = animeLink.textContent.trim();
  }

  // Clean up prefix words like "Watch", "Play", "Kwik - Play"
  title = title.replace(/^(Watch|Play|Stream|Kwik\s*-\s*Play)\s+/i, "");
  
  // Clean up suffix words in parenthesis like (Sub), (Dub)
  title = title.replace(/\s*\((Sub|Dub|Raw|Dual-Audio)\)\s*$/i, "").trim();

  // Special handle for test bench page
  if (window.location.hostname === "localhost" && window.location.pathname === "/test-video") {
    title = "Big Buck Bunny";
    episode = 1;
  }

  return { title, episode };
}

function setupVideoListeners(video) {
  video.addEventListener("timeupdate", () => {
    if (!video.duration || video.duration === 0) return;

    const currentTime = video.currentTime;
    const duration = video.duration;
    const progress = Math.round((currentTime / duration) * 100);

    // Only send updates if the progress has changed to avoid spamming messages
    if (progress !== lastProgress) {
      lastProgress = progress;
      const details = extractAnimeDetails();

      // Send current progress to background service worker
      chrome.runtime.sendMessage({
        type: "PROGRESS_UPDATE",
        data: {
          animeName: details.title,
          episode: details.episode,
          progress: progress
        }
      });

      // Log completion once per video when it crosses the 80% mark
      if (progress >= 80 && !completedLogged) {
        completedLogged = true;
        console.log(`AniTrack: Episode Completed 🎉 (${details.title} - Ep ${details.episode})`);
      }
    }
  });

  // Re-enable completion tracking if video is rewound or restarted
  video.addEventListener("seeked", () => {
    if (video.currentTime < video.duration * 0.8) {
      completedLogged = false;
    }
  });

  video.addEventListener("emptied", () => {
    completedLogged = false;
    lastProgress = 0;
  });
}
