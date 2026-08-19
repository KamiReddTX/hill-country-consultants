import type { MetadataRoute } from "next";
import { SERVICE_SLUGS, publicServiceSlug } from "@/content/services";
import { INDUSTRIES } from "@/content/industries";
import { CLASSES } from "@/content/classes";

// Served from www (apex 301-redirects to it), so the sitemap uses the www host.
const raw = process.env.NEXT_PUBLIC_SITE_URL || "https://www.hillcountryconsultants.com";
const base = raw
  .replace(/:\/\/hillcountryconsultants\.com/, "://www.hillcountryconsultants.com")
  .replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "", "/services", "/work", "/industries", "/training", "/plans", "/book",
    "/about", "/faq", "/get-started", "/portal-preview", "/careers",
    "/policies", "/terms", "/refund-policy", "/privacy",
  ];
  const services = SERVICE_SLUGS.map((k) => `/services/${publicServiceSlug(k)}`);
  const industries = INDUSTRIES.map((i) => `/industries/${i.slug}`);
  const classes = CLASSES.map((c) => `/training/${c.slug}`);
  const now = new Date();
  return [...staticPaths, ...services, ...industries, ...classes].map((p) => ({
    url: `${base}${p || "/"}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: p === "" ? 1 : 0.7,
  }));
}
