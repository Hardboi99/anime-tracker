"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import DetailModal from "@/components/DetailModal";

type Status = "WATCHING" | "COMPLETED" | "DROPPED" | "PLAN_TO_WATCH";

interface WatchlistEntry {
  id: string;
  animeId: number;
  status: Status;
  currentEpisode: number;
  rating: number | null;
  userRating?: number | null;
  anime: {
    title: string;
    image: string;
    episodes: number;
    genres: string[];
  };
}

const STATUS_LABELS: Record<Status, string> = {
  WATCHING: "Watching",
  COMPLETED: "Completed",
  DROPPED: "Dropped",
  PLAN_TO_WATCH: "Plan to Watch",
};

const STATUS_BADGE: Record<Status, string> = {
  WATCHING: "badge-watching",
  COMPLETED: "badge-completed",
  DROPPED: "badge-dropped",
  PLAN_TO_WATCH: "badge-plan",
};

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | "ALL">("ALL");

  // Modal State
  const [selectedAnimeId, setSelectedAnimeId] = useState<number | null>(null);
  const [selectedWatchlistEntry, setSelectedWatchlistEntry] = useState<any>(null);

  const fetchWatchlist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/watchlist");
      if (!res.ok) {
        throw new Error(`Failed to load watchlist (status: ${res.status})`);
      }
      const data = await res.json();
      setWatchlist(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch watchlist:", err);
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  async function updateEpisode(e: React.MouseEvent, entry: WatchlistEntry, delta: number) {
    e.stopPropagation(); // Stop card click modal trigger
    const originalEpisode = entry.currentEpisode;
    const newEp = entry.anime.episodes > 0 
      ? Math.min(entry.anime.episodes, Math.max(0, originalEpisode + delta))
      : Math.max(0, originalEpisode + delta);

    if (newEp === originalEpisode) return;

    // Optimistically update local state
    setWatchlist((prev) =>
      prev.map((item) => (item.id === entry.id ? { ...item, currentEpisode: newEp } : item))
    );

    try {
      const res = await fetch("/api/watchlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id, currentEpisode: newEp }),
      });
      if (!res.ok) {
        throw new Error("Failed to save episode progress");
      }
      const updated = await res.json();
      setWatchlist((prev) =>
        prev.map((item) => (item.id === entry.id ? { ...item, currentEpisode: updated.currentEpisode ?? newEp } : item))
      );
    } catch (err) {
      console.error("Failed to update episode progress:", err);
      // Rollback to original value
      setWatchlist((prev) =>
        prev.map((item) => (item.id === entry.id ? { ...item, currentEpisode: originalEpisode } : item))
      );
    }
  }

  async function updateStatus(e: React.ChangeEvent<HTMLSelectElement>, entry: WatchlistEntry, status: Status) {
    e.stopPropagation(); // Stop card click modal trigger
    const originalStatus = entry.status;
    if (status === originalStatus) return;

    // Optimistically update local state
    setWatchlist((prev) =>
      prev.map((item) => (item.id === entry.id ? { ...item, status } : item))
    );

    try {
      const res = await fetch("/api/watchlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id, status }),
      });
      if (!res.ok) {
        throw new Error("Failed to save status update");
      }
      const updated = await res.json();
      setWatchlist((prev) =>
        prev.map((item) => (item.id === entry.id ? { ...item, status: updated.status ?? status } : item))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      // Rollback to original value
      setWatchlist((prev) =>
        prev.map((item) => (item.id === entry.id ? { ...item, status: originalStatus } : item))
      );
    }
  }

  async function removeEntry(e: React.MouseEvent, id: string) {
    e.stopPropagation(); // Stop card click modal trigger
    try {
      const res = await fetch(`/api/watchlist?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setWatchlist((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleOpenModal(entry: WatchlistEntry) {
    setSelectedWatchlistEntry({
      status: entry.status,
      currentEpisode: entry.currentEpisode,
      userRating: entry.userRating || null
    });
    setSelectedAnimeId(entry.animeId);
  }

  const filtered =
    filter === "ALL" ? watchlist : watchlist.filter((entry) => entry.status === filter);

  const counts: Record<string, number> = {
    ALL: watchlist.length,
    WATCHING: watchlist.filter((entry) => entry.status === "WATCHING").length,
    COMPLETED: watchlist.filter((entry) => entry.status === "COMPLETED").length,
    DROPPED: watchlist.filter((entry) => entry.status === "DROPPED").length,
    PLAN_TO_WATCH: watchlist.filter((entry) => entry.status === "PLAN_TO_WATCH").length,
  };

  return (
    <div>
      <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
        My Watchlist
      </h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "28px", fontSize: "14px" }}>
        {watchlist.length} anime tracked
      </p>

      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "28px",
          flexWrap: "wrap",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "16px",
        }}
      >
        {(["ALL", "WATCHING", "COMPLETED", "DROPPED", "PLAN_TO_WATCH"] as const).map(
          (s) => (
            <button
              key={s}
              id={`filter-${s}`}
              onClick={() => setFilter(s)}
              style={{
                padding: "6px 16px",
                borderRadius: "20px",
                border: filter === s ? "1px solid var(--accent)" : "1px solid var(--border)",
                background: filter === s ? "rgba(139,92,246,0.15)" : "transparent",
                color: filter === s ? "var(--accent-light)" : "var(--text-secondary)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {s === "ALL" ? "All" : STATUS_LABELS[s]} ({counts[s]})
            </button>
          )
        )}
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: "100px", borderRadius: "12px" }} />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px", color: "var(--text-secondary)" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
          <p>No anime here yet. Search and add some!</p>
        </div>
      )}

      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="glass fade-in"
              onClick={() => handleOpenModal(entry)}
              style={{
                display: "flex",
                gap: "16px",
                padding: "16px",
                alignItems: "center",
                cursor: "pointer",
                transition: "border-color 0.2s ease"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              {/* Poster */}
              <div
                style={{
                  position: "relative",
                  width: "60px",
                  height: "85px",
                  flexShrink: 0,
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <Image
                  src={entry.anime.image}
                  alt={entry.anime.title}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="60px"
                  unoptimized
                />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                  <h3
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entry.anime.title}
                  </h3>
                  <span className={`badge ${STATUS_BADGE[entry.status]}`}>
                    {STATUS_LABELS[entry.status]}
                  </span>
                  {entry.userRating && (
                    <span style={{ fontSize: "12px", color: "#fbbf24", fontWeight: 700 }}>
                      ⭐ {entry.userRating}/10
                    </span>
                  )}
                </div>

                {/* Genres */}
                <div style={{ display: "flex", gap: "4px", marginBottom: "10px", flexWrap: "wrap" }}>
                  {entry.anime.genres.slice(0, 3).map((g) => (
                    <span
                      key={g}
                      style={{
                        fontSize: "10px",
                        background: "rgba(139,92,246,0.1)",
                        color: "var(--accent-light)",
                        border: "1px solid rgba(139,92,246,0.2)",
                        borderRadius: "4px",
                        padding: "2px 6px",
                      }}
                    >
                      {g}
                    </span>
                  ))}
                </div>

                {/* Episode counter */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <div className="episode-counter" onClick={(e) => e.stopPropagation()}>
                    <button
                      id={`ep-minus-${entry.id}`}
                      className="episode-btn"
                      onClick={(e) => updateEpisode(e, entry, -1)}
                    >
                      −
                    </button>
                    <span style={{ fontSize: "13px", fontWeight: 600, minWidth: "80px", textAlign: "center" }}>
                      Ep {entry.currentEpisode}
                      {entry.anime.episodes > 0 && ` / ${entry.anime.episodes}`}
                    </span>
                    <button
                      id={`ep-plus-${entry.id}`}
                      className="episode-btn"
                      onClick={(e) => updateEpisode(e, entry, 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Status selector + remove */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
                <select
                  id={`status-${entry.id}`}
                  value={entry.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateStatus(e, entry, e.target.value as Status)}
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <button
                  id={`remove-${entry.id}`}
                  onClick={(e) => removeEntry(e, entry.id)}
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#f87171",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info & Trailer Modal */}
      {selectedAnimeId && (
        <DetailModal
          animeId={selectedAnimeId}
          watchlistEntry={selectedWatchlistEntry}
          onClose={() => {
            setSelectedAnimeId(null);
            setSelectedWatchlistEntry(null);
          }}
          onUpdate={fetchWatchlist}
        />
      )}
    </div>
  );
}
