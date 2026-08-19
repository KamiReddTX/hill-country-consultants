import type { MetadataRoute } from "next";

const raw = process.env.NEXT_PUBLIC_SITE_URL || "https://www.hillcountryconsultants.com";
const base = raw
  .replace(/:\/\/hillcountryconsultants\.com/, "://www.hillcountryconsultants.com")
  .replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep private and functional areas out of the index.
        disallow: ["/portal/", "/staff/", "/api/", "/auth/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
