"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface DetailModalProps {
  animeId: number;
  watchlistEntry?: {
    status: string;
    currentEpisode: number;
    userRating: number | null;
  } | null;
  onClose: () => void;
  onUpdate: () => void;
}

interface JikanAnimeDetails {
  title: string;
  synopsis: string | null;
  score: number | null;
  episodes: number | null;
  status: string;
  studios: Array<{ name: string }>;
  genres: Array<{ name: string }>;
  images: { jpg: { large_image_url: string } };
  trailer: { youtube_id: string | null };
}

export default function DetailModal({ animeId, watchlistEntry, onClose, onUpdate }: DetailModalProps) {
  const [details, setDetails] = useState<JikanAnimeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Local state for tracking inputs
  const [status, setStatus] = useState(watchlistEntry?.status || "");
  const [currentEpisode, setCurrentEpisode] = useState(watchlistEntry?.currentEpisode || 0);
  const [userRating, setUserRating] = useState<number | null>(watchlistEntry?.userRating || null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoading(true);
        const res = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch anime metadata");
        }
        const data = await res.json();
        setDetails(data.data);
      } catch (err: any) {
        console.error(err);
        setError("Could not load anime details. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [animeId]);

  async function handleSaveTracking() {
    setSaving(true);
    try {
      if (!status) {
        // If status is empty (i.e. 'Remove' selected), call delete
        const res = await fetch(`/api/watchlist?animeId=${animeId}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
      } else {
        // If already exists, PATCH it. Else POST to add
        if (watchlistEntry) {
          const res = await fetch("/api/watchlist", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              animeId,
              status,
              currentEpisode: Number(currentEpisode),
              userRating
            })
          });
          if (!res.ok) throw new Error();
        } else {
          const res = await fetch("/api/watchlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              animeId,
              title: details?.title,
              image: details?.images.jpg.large_image_url,
              episodes: details?.episodes,
              genres: details?.genres.map(g => g.name),
              rating: details?.score,
              status
            })
          });
          if (!res.ok) throw new Error();
        }
      }
      onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(9, 9, 14, 0.75)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        zIndex: 1000,
        overflowY: "auto"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass fade-in"
        style={{
          width: "100%",
          maxWidth: "850px",
          background: "rgba(22, 22, 31, 0.95)",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          position: "relative",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)"
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")}
        >
          &times;
        </button>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "40px 0" }}>
            <div className="skeleton" style={{ height: "40px", width: "60%" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
              <div className="skeleton" style={{ height: "300px", borderRadius: "12px" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="skeleton" style={{ height: "160px" }} />
                <div className="skeleton" style={{ height: "40px" }} />
                <div className="skeleton" style={{ height: "40px" }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#f87171" }}>
            <p style={{ fontSize: "18px", fontWeight: "bold" }}>{error}</p>
            <button className="btn-secondary" onClick={onClose} style={{ marginTop: "16px" }}>Close</button>
          </div>
        )}

        {!loading && !error && details && (
          <>
            <div>
              <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", paddingRight: "40px" }}>
                {details.title}
              </h2>
              {details.studios?.[0] && (
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Studio: <span style={{ color: "var(--accent-light)", fontWeight: 600 }}>{details.studios[0].name}</span>
                </p>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "32px", minWidth: 0 }}>
              {/* Left Column: Poster & Trailer */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {details.trailer.youtube_id ? (
                  <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)", background: "#000" }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${details.trailer.youtube_id}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ width: "100%", height: "100%", border: "none" }}
                    />
                  </div>
                ) : (
                  <div style={{ position: "relative", width: "100%", height: "300px", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)" }}>
                    <Image
                      src={details.images.jpg.large_image_url}
                      alt={details.title}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="350px"
                    />
                  </div>
                )}

                {/* Tracking Form (Always shown to logged-in user) */}
                <div className="glass" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                    Tracking Options
                  </h3>

                  <div>
                    <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }}
                    >
                      <option value="">Not Tracked / Remove</option>
                      <option value="WATCHING">Watching</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="DROPPED">Dropped</option>
                      <option value="PLAN_TO_WATCH">Plan to Watch</option>
                    </select>
                  </div>

                  {status && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Episodes Watched</label>
                        <input
                          type="number"
                          min="0"
                          max={details.episodes || 9999}
                          value={currentEpisode}
                          onChange={(e) => setCurrentEpisode(Math.max(0, Number(e.target.value)))}
                          style={{ width: "100%", padding: "8px 12px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>My Rating</label>
                        <select
                          value={userRating || ""}
                          onChange={(e) => setUserRating(e.target.value ? Number(e.target.value) : null)}
                          style={{ width: "100%", padding: "8px 12px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }}
                        >
                          <option value="">No Rating</option>
                          {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((s) => (
                            <option key={s} value={s}>⭐ {s} / 10</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <button
                    className="action-btn"
                    onClick={handleSaveTracking}
                    disabled={saving}
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "linear-gradient(135deg, #7c3aed, #6366f1)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 600,
                      cursor: "pointer",
                      marginTop: "4px"
                    }}
                  >
                    {saving ? "Saving..." : "Save Status"}
                  </button>
                </div>
              </div>

              {/* Right Column: Metadata & Synopsis */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Score & Episode Metadata */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="glass" style={{ padding: "14px", textAlign: "center" }}>
                    <p style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                      MAL Rating
                    </p>
                    <span style={{ fontSize: "20px", fontWeight: 800, color: "#fbbf24" }}>
                      ⭐ {details.score || "?"}
                    </span>
                  </div>

                  <div className="glass" style={{ padding: "14px", textAlign: "center" }}>
                    <p style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                      Episodes
                    </p>
                    <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--accent-light)" }}>
                      {details.episodes || "?"} eps
                    </span>
                  </div>
                </div>

                {/* Genres */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {details.genres.map((g) => (
                    <span
                      key={g.name}
                      style={{
                        fontSize: "11px",
                        background: "rgba(139,92,246,0.12)",
                        color: "var(--accent-light)",
                        border: "1px solid rgba(139,92,246,0.25)",
                        borderRadius: "20px",
                        padding: "4px 12px",
                      }}
                    >
                      {g.name}
                    </span>
                  ))}
                </div>

                {/* Synopsis */}
                <div className="glass" style={{ padding: "24px", minHeight: "150px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", marginBottom: "12px" }}>
                    Synopsis
                  </h3>
                  <p
                    style={{
                      fontSize: "13px",
                      lineHeight: "1.7",
                      color: "var(--text-primary)",
                      textAlign: "justify"
                    }}
                  >
                    {details.synopsis || "No synopsis available."}
                  </p>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)" }}>
                  <span>Status: {details.status}</span>
                  <a
                    href={`https://myanimelist.net/anime/${animeId}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--accent-light)", textDecoration: "none" }}
                  >
                    View on MAL →
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
