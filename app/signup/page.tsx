"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";

const googleProvider = new GoogleAuthProvider();

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function setSession(idToken: string) {
    await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
  }

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await setSession(await cred.user.getIdToken());
      router.push("/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else if (code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setGoogleLoading(true);
    setError("");
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await setSession(await cred.user.getIdToken());
      router.push("/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        // user closed popup — do nothing
      } else if (code === "auth/unauthorized-domain") {
        setError(`Domain not authorized. Go to Firebase Console → Authentication → Settings → Authorized domains and add 'localhost'.`);
      } else if (code === "auth/operation-not-allowed") {
        setError("Google Sign-In is not enabled. Go to Firebase Console → Authentication → Sign-in method and enable Google.");
      } else if (code === "auth/configuration-not-found") {
        setError("Firebase config error. Check your .env NEXT_PUBLIC_ variables are correct.");
      } else {
        setError(`Error: ${code || "unknown"}. Check browser console for details.`);
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      {/* Background glow */}
      <div style={{ position: "fixed", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />

      <div className="glass fade-in" style={{ width: "100%", maxWidth: "420px", padding: "40px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none", marginBottom: "24px" }}>
            <span style={{ fontSize: "24px" }}>⛩️</span>
            <span style={{ fontWeight: 800, fontSize: "20px", background: "linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #60a5fa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              AniTrack
            </span>
          </Link>
          <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "8px", color: "var(--text-primary)" }}>Create your account</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Start tracking your anime in seconds</p>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "12px 16px", color: "#f87171", fontSize: "14px", marginBottom: "20px" }}>
            {error}
          </div>
        )}

        {/* Google Sign-Up */}
        <button
          id="google-signup-btn"
          onClick={handleGoogleSignup}
          disabled={googleLoading}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            fontSize: "15px",
            fontWeight: 600,
            cursor: googleLoading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            marginBottom: "20px",
            opacity: googleLoading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => { if (!googleLoading) e.currentTarget.style.borderColor = "#4285f4"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          {googleLoading ? "Signing up..." : "Continue with Google"}
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>or sign up with email</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>

        {/* Email signup form */}
        <form onSubmit={handleEmailSignup} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label htmlFor="name" style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Display Name</label>
            <input id="name" type="text" className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </div>
          <div>
            <label htmlFor="signup-email" style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Email</label>
            <input id="signup-email" type="email" className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <label htmlFor="signup-password" style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Password</label>
            <input id="signup-password" type="password" className="input" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
          </div>
          <button id="signup-submit" type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: "15px", marginTop: "4px", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Creating account..." : "Create Account →"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent-light)", fontWeight: 600, textDecoration: "none" }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
