"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Status = "WATCHING" | "COMPLETED" | "DROPPED" | "PLAN_TO_WATCH";

interface WatchlistEntry {
  status: Status;
  currentEpisode: number;
  anime: {
    title: string;
    genres: string[];
    episodes: number;
  };
}

const STATUS_CONFIG = {
  WATCHING: { label: "Watching", color: "#3b82f6", icon: "📺" },
  COMPLETED: { label: "Completed", color: "#22c55e", icon: "✅" },
  DROPPED: { label: "Dropped", color: "#ef4444", icon: "🗑️" },
  PLAN_TO_WATCH: { label: "Plan to Watch", color: "#f59e0b", icon: "📌" },
};

export default function DashboardPage() {
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/watchlist");
      if (!res.ok) {
        throw new Error(`Failed to load data (status: ${res.status})`);
      }
      const data = await res.json();
      setWatchlist(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Failed to fetch dashboard data:", err);
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute stats
  const counts = {
    WATCHING: watchlist.filter((e) => e.status === "WATCHING").length,
    COMPLETED: watchlist.filter((e) => e.status === "COMPLETED").length,
    DROPPED: watchlist.filter((e) => e.status === "DROPPED").length,
    PLAN_TO_WATCH: watchlist.filter((e) => e.status === "PLAN_TO_WATCH").length,
  };

  const totalEpisodes = watchlist.reduce((sum, e) => sum + e.currentEpisode, 0);

  // Genre frequency
  const genreMap = new Map<string, number>();
  watchlist.forEach((e) => {
    e.anime.genres.forEach((g) => {
      genreMap.set(g, (genreMap.get(g) || 0) + 1);
    });
  });
  const genreData = Array.from(genreMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // Pie chart data
  const pieData = (Object.entries(counts) as [Status, number][])
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: STATUS_CONFIG[key].label,
      value,
      color: STATUS_CONFIG[key].color,
    }));

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: "36px", width: "200px", marginBottom: "32px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: "100px", borderRadius: "16px" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
        Dashboard
      </h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "32px", fontSize: "14px" }}>
        Your anime journey at a glance
      </p>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "40px",
        }}
      >
        {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(
          ([key, cfg]) => (
            <div key={key} className="stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                    {cfg.label}
                  </p>
                  <p
                    style={{
                      fontSize: "40px",
                      fontWeight: 900,
                      color: cfg.color,
                      lineHeight: 1,
                    }}
                  >
                    {counts[key]}
                  </p>
                </div>
                <span style={{ fontSize: "28px" }}>{cfg.icon}</span>
              </div>
            </div>
          )
        )}

        {/* Total episodes card */}
        <div className="stat-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                Episodes Watched
              </p>
              <p
                style={{
                  fontSize: "40px",
                  fontWeight: 900,
                  background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  lineHeight: 1,
                }}
              >
                {totalEpisodes}
              </p>
            </div>
            <span style={{ fontSize: "28px" }}>🎬</span>
          </div>
        </div>
      </div>

      {watchlist.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px",
            color: "var(--text-secondary)",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>⛩️</div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px", color: "var(--text-primary)" }}>
            Your journey starts here
          </h2>
          <p>Head to Search and add anime to your watchlist to see your stats here.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
          }}
        >
          {/* Pie Chart */}
          <div className="glass" style={{ padding: "28px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "24px", color: "var(--text-primary)" }}>
              Status Distribution
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                  }}
                />
                <Legend
                  iconType="circle"
                  formatter={(value) => (
                    <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart - Top Genres */}
          <div className="glass" style={{ padding: "28px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "24px", color: "var(--text-primary)" }}>
              Top Genres
            </h2>
            {genreData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={genreData} layout="vertical" margin={{ left: 16 }}>
                  <XAxis
                    type="number"
                    tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                    }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: "80px" }}>
                Add anime to see genre stats
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
