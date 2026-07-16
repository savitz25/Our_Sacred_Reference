import type { MetadataRoute } from "next";
import { getPostsSorted } from "@/lib/blog/posts";

const base =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.oursacredreference.com";

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

  const staticEntries: MetadataRoute.Sitemap = routes.map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency:
      path === "" || path === "/book-session" || path === "/blog"
        ? "weekly"
        : "monthly",
    priority:
      path === ""
        ? 1
        : path === "/book-session"
          ? 0.9
          : path === "/blog"
            ? 0.8
            : 0.6,
  }));

  const postEntries: MetadataRoute.Sitemap = getPostsSorted().map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...postEntries];
}
