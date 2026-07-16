import type { MetadataRoute } from "next";

const base =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.sacredreference.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/about",
    "/approach",
    "/offerings",
    "/blog",
    "/book-session",
    "/login",
    "/terms",
    "/privacy-policy",
    "/consent",
  ];

  const now = new Date();

  return routes.map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/book-session" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/book-session" ? 0.9 : 0.6,
  }));
}
