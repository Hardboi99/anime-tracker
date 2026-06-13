"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/search", label: "Search", icon: "🔍" },
    { href: "/watchlist", label: "Watchlist", icon: "📋" },
  ];

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 32px",
        height: "64px",
        borderBottom: "1px solid var(--border)",
        background: "rgba(10,10,15,0.9)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          textDecoration: "none",
        }}
      >
        <span style={{ fontSize: "20px" }}>⛩️</span>
        <span
          style={{
            fontWeight: 800,
            fontSize: "18px",
            background:
              "linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #60a5fa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          AniTrack
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: "flex", gap: "4px" }}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link ${pathname === link.href ? "active" : ""}`}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>

      {/* User info + sign out */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {user?.displayName && (
          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            {user.displayName}
          </span>
        )}
        <button
          id="signout-btn"
          onClick={signOut}
          className="btn-ghost"
          style={{ fontSize: "13px" }}
        >
          Sign Out →
        </button>
      </div>
    </nav>
  );
}
