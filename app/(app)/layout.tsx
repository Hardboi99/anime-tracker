import Navbar from "@/components/Navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Navbar />
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
        {children}
      </main>
    </div>
  );
}
