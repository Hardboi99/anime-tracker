"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Anime {
  mal_id: number;
  title: string;
  images: { jpg: { image_url: string; large_image_url: string } };
  episodes: number | null;
  score: number | null;
  genres: Array<{ mal_id: number; name: string }>;
  synopsis: string | null;
  status: string;
}

interface SearchResult {
  data: Anime[];
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [topAnime, setTopAnime] = useState<Anime[]>([]);

  // Load top anime on mount
  useEffect(() => {
    fetch("https://api.jikan.moe/v4/top/anime?limit=12")
      .then((r) => r.json())
      .then((d: SearchResult) => setTopAnime(d.data || []))
      .catch(console.error);
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=20&sfw=true`
      );
      const data: SearchResult = await res.json();
      setResults(data.data || []);
    } catch {
      console.error("Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function addToWatchlist(anime: Anime, status = "PLAN_TO_WATCH") {
    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        animeId: anime.mal_id,
        title: anime.title,
        image: anime.images.jpg.large_image_url,
        episodes: anime.episodes || 0,
        genres: anime.genres.map((g) => g.name),
        rating: anime.score || 0,
        status,
      }),
    });
    setAddedIds((prev) => new Set([...prev, anime.mal_id]));
  }

  const displayList = results.length > 0 ? results : topAnime;
  const isTopAnime = results.length === 0;

  return (
    <div>
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 800,
          marginBottom: "8px",
          color: "var(--text-primary)",
        }}
      >
        Search Anime
      </h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "28px", fontSize: "14px" }}>
        Powered by Jikan (MyAnimeList) — 30,000+ anime available
      </p>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px", marginBottom: "40px" }}>
        <input
          id="anime-search-input"
          type="text"
          className="input"
          placeholder="Search for anime... e.g. Naruto, One Piece, Attack on Titan"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1 }}
        />
        <button
          id="anime-search-btn"
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ whiteSpace: "nowrap" }}
        >
          {loading ? "Searching..." : "🔍 Search"}
        </button>
      </form>

      {/* Section label */}
      <h2
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "var(--text-secondary)",
          marginBottom: "20px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {isTopAnime ? "🏆 Top Anime" : `Results for "${query}"`}
      </h2>

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "20px" }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton" style={{ height: "260px", borderRadius: "10px", marginBottom: "10px" }} />
              <div className="skeleton" style={{ height: "16px", width: "80%", marginBottom: "6px" }} />
              <div className="skeleton" style={{ height: "12px", width: "50%" }} />
            </div>
          ))}
        </div>
      )}

      {/* Anime grid */}
      {!loading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "20px",
          }}
        >
          {displayList.map((anime) => (
            <div key={anime.mal_id} className="anime-card fade-in">
              {/* Poster */}
              <div style={{ position: "relative", height: "260px", overflow: "hidden" }}>
                <Image
                  src={anime.images.jpg.large_image_url || anime.images.jpg.image_url}
                  alt={anime.title}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="200px"
                />
                {/* Score badge */}
                {anime.score && (
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      background: "rgba(0,0,0,0.75)",
                      backdropFilter: "blur(4px)",
                      borderRadius: "6px",
                      padding: "3px 8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#fbbf24",
                    }}
                  >
                    ⭐ {anime.score}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: "12px" }}>
                <h3
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    marginBottom: "6px",
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={anime.title}
                >
                  {anime.title}
                </h3>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "10px" }}>
                  {anime.episodes ? `${anime.episodes} eps` : "? eps"} •{" "}
                  {anime.status === "Finished Airing" ? "Finished" : anime.status}
                </p>

                {/* Genres */}
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "10px" }}>
                  {anime.genres.slice(0, 2).map((g) => (
                    <span
                      key={g.mal_id}
                      style={{
                        fontSize: "10px",
                        background: "rgba(139,92,246,0.12)",
                        color: "var(--accent-light)",
                        border: "1px solid rgba(139,92,246,0.25)",
                        borderRadius: "4px",
                        padding: "2px 6px",
                      }}
                    >
                      {g.name}
                    </span>
                  ))}
                </div>

                <button
                  id={`add-watchlist-${anime.mal_id}`}
                  onClick={() => addToWatchlist(anime)}
                  disabled={addedIds.has(anime.mal_id)}
                  style={{
                    width: "100%",
                    padding: "7px",
                    borderRadius: "6px",
                    border: addedIds.has(anime.mal_id)
                      ? "1px solid rgba(34,197,94,0.3)"
                      : "1px solid var(--accent)",
                    background: addedIds.has(anime.mal_id)
                      ? "rgba(34,197,94,0.1)"
                      : "rgba(139,92,246,0.15)",
                    color: addedIds.has(anime.mal_id) ? "#4ade80" : "var(--accent-light)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: addedIds.has(anime.mal_id) ? "default" : "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {addedIds.has(anime.mal_id) ? "✓ Added" : "+ Watchlist"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <div
          style={{
            textAlign: "center",
            padding: "80px 24px",
            color: "var(--text-secondary)",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
          <p>No results for &quot;{query}&quot;. Try a different title.</p>
        </div>
      )}
    </div>
  );
}
