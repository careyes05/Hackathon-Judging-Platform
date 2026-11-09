import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hackathon Hub — Build something that matters",
  description:
    "A home for hackathon events, team submissions, and thoughtful judging.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <header className="topbar">
            <Link href="/" className="brand" aria-label="Hackathon Hub home">
              <span className="brand-mark"><Sparkles size={17} /></span>
              <span>hackathon<span className="brand-light">hub</span></span>
            </Link>
            <nav className="topnav" aria-label="Main navigation">
              <Link href="/">Explore events</Link>
              <Link href="/judges">Judges &amp; organizers <ArrowUpRight size={14} /></Link>
            </nav>
          </header>
          <main>{children}</main>
          <footer className="footer">
            <span>Made for people who make things.</span>
            <span>Hackathon Hub <span className="footer-dot">·</span> 2026</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
