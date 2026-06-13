import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AniTrack — Your Anime Progress Tracker",
  description:
    "Track your anime watchlist, progress, and ratings in one beautiful dashboard. Never lose track of where you left off.",
  keywords: ["anime", "tracker", "watchlist", "manga", "myanimelist"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
