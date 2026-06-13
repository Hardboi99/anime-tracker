import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 48px",
          borderBottom: "1px solid var(--border)",
          background: "rgba(10,10,15,0.8)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>⛩️</span>
          <span
            style={{
              fontWeight: 800,
              fontSize: "20px",
              background:
                "linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #60a5fa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            AniTrack
          </span>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link href="/login" className="btn-secondary" style={{ textDecoration: "none" }}>
            Log In
          </Link>
          <Link href="/signup" className="btn-primary" style={{ textDecoration: "none" }}>
            Get Started →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "80px 24px",
          gap: "32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow blobs */}
        <div
          style={{
            position: "absolute",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
            top: "-100px",
            left: "50%",
            transform: "translateX(-50%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(139,92,246,0.12)",
            border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: "100px",
            padding: "6px 16px",
            fontSize: "13px",
            color: "var(--accent-light)",
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#a78bfa",
              display: "inline-block",
            }}
          />
          Your anime journey, beautifully tracked
        </div>

        <h1
          style={{
            fontSize: "clamp(40px, 7vw, 80px)",
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            maxWidth: "800px",
          }}
        >
          Track Every Anime.{" "}
          <span
            style={{
              background:
                "linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #60a5fa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Never Miss an Episode.
          </span>
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "var(--text-secondary)",
            maxWidth: "560px",
            lineHeight: 1.7,
          }}
        >
          AniTrack is your personal anime dashboard. Search, save, rate, and
          track your progress — all in one place. With auto-sync coming soon.
        </p>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/signup" className="btn-primary" style={{ textDecoration: "none", padding: "14px 32px", fontSize: "16px" }}>
            Start Tracking Free →
          </Link>
          <Link href="/search" className="btn-secondary" style={{ textDecoration: "none", padding: "14px 32px", fontSize: "16px" }}>
            Browse Anime
          </Link>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: "48px",
            marginTop: "24px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            { label: "Anime in Database", value: "30,000+" },
            { label: "Statuses Tracked", value: "4" },
            { label: "Episode Sync", value: "Auto" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  background:
                    "linear-gradient(135deg, #a78bfa, #60a5fa)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section
        style={{
          padding: "80px 48px",
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: "36px",
            fontWeight: 800,
            marginBottom: "48px",
          }}
        >
          Everything you need to track anime
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {[
            {
              icon: "🔍",
              title: "Search 30k+ Anime",
              desc: "Powered by the Jikan API (MyAnimeList). Search by title, genre, or season.",
            },
            {
              icon: "📋",
              title: "4-Status Watchlist",
              desc: "Watching, Completed, Dropped, or Plan to Watch. Organize your entire library.",
            },
            {
              icon: "📺",
              title: "Episode Progress",
              desc: "Track exactly which episode you're on. Hit + to advance, - to go back.",
            },
            {
              icon: "⭐",
              title: "Rate & Review",
              desc: "Score anime out of 10 to remember your favorites and share your taste.",
            },
            {
              icon: "📊",
              title: "Dashboard Charts",
              desc: "Beautiful stats on your watching habits. See your top genres and completion rate.",
            },
            {
              icon: "🔌",
              title: "Browser Extension",
              desc: "Auto-detect and sync progress while watching on AnimePahe and more. Coming soon.",
            },
          ].map((feature) => (
            <div key={feature.title} className="glass" style={{ padding: "28px" }}>
              <div style={{ fontSize: "32px", marginBottom: "16px" }}>
                {feature.icon}
              </div>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  marginBottom: "10px",
                  color: "var(--text-primary)",
                }}
              >
                {feature.title}
              </h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "24px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "var(--text-muted)",
          fontSize: "13px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <span>⛩️ AniTrack — Built with Next.js + Supabase</span>
        <span>Powered by Jikan API (MyAnimeList)</span>
      </footer>
    </main>
  );
}
