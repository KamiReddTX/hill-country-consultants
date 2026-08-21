import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { SITE } from "@/content/site";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-fraunces",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

// The site is served from www (the apex 301-redirects to it), so metadata
// (canonical + og:url) must use the www host to match what is actually served —
// even if the deploy env var is still set to the bare domain.
const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.hillcountryconsultants.com";
const siteUrl = rawSiteUrl.replace(
  /:\/\/hillcountryconsultants\.com/,
  "://www.hillcountryconsultants.com",
);

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description:
    "One flat monthly fee puts a whole firm behind your business — admin, documentation, compliance, coordination, marketing, publishing and more. Hybrid consulting and virtual assistance, since 2024.",
  // og:title / og:description / og:url fall back to each page's own metadata,
  // so shared links preview per-page instead of site-wide.
  openGraph: {
    siteName: SITE.name,
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
