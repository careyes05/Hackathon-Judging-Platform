import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import Logo, { LogoRow } from "@/components/logo";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

export const metadata: Metadata = {
  title: siteConfig.meta.title,
  description: siteConfig.meta.description,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { brand, logos, nav, footer } = siteConfig;
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <header className="topbar">
            <Link href="/" className="brand" aria-label={brand.homeLabel}>
              {logos.header ? (
                <Logo slot={logos.header} />
              ) : (
                <span className="brand-mark"><Sparkles size={17} /></span>
              )}
              <span>{brand.wordmarkLead}{" "}<span className="brand-light">{brand.wordmarkTrail}</span></span>
            </Link>
            <nav className="topnav" aria-label="Main navigation">
              <Link href="/">{nav.exploreEvents}</Link>
              <Link href="/judges">{nav.staff} <ArrowUpRight size={14} /></Link>
            </nav>
          </header>
          <main>{children}</main>
          <LogoRow slots={logos.partners} label={footer.partnersLabel} />
          <footer className="footer">
            <span className="footer-left">
              {logos.footer ? <Logo slot={logos.footer} /> : null}
              {footer.tagline}
            </span>
            <span>{footer.credit} <span className="footer-dot">·</span> {footer.year}</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
