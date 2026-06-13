"use client";

import Link from "next/link";

export default function TestVideoPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div className="glass fade-in" style={{ maxWidth: "800px", width: "100%", padding: "32px", textAlign: "center" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px", background: "linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          Extension Test Bench
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "28px" }}>
          Play the video below to test the AniTrack extension's detection and progress tracking features.
        </p>

        {/* Video Player Container */}
        <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)", background: "#000", aspectRatio: "16/9", marginBottom: "28px" }}>
          <video
            id="test-video-player"
            controls
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
          <Link href="/dashboard" style={{ color: "var(--text-secondary)", fontSize: "14px", textDecoration: "none" }}>
            ← Back to Dashboard
          </Link>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", background: "rgba(139,92,246,0.1)", padding: "4px 10px", borderRadius: "20px", border: "1px solid rgba(139,92,246,0.2)" }}>
            Site: test-bench
          </span>
        </div>
      </div>
    </div>
  );
}
