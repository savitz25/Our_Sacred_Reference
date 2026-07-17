import type { MetadataRoute } from "next";
import { getPostsSorted } from "@/lib/blog/posts";
import { PRODUCTION_SITE_URL } from "@/lib/seo/site";

type Freq = MetadataRoute.Sitemap[number]["changeFrequency"];

const STATIC_ROUTES: {
  path: string;
  changeFrequency: Freq;
  priority: number;
}[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/book-session", changeFrequency: "weekly", priority: 0.95 },
  { path: "/approach", changeFrequency: "monthly", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.9 },
  { path: "/offerings", changeFrequency: "monthly", priority: 0.9 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.85 },
  { path: "/consent", changeFrequency: "yearly", priority: 0.4 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
  // /login intentionally omitted (noindex / low value)
];

/**
 * Sitemap always uses the production domain.
 * Do not depend on localhost or preview env vars for crawl URLs.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = PRODUCTION_SITE_URL;
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${base}${r.path || "/"}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const postEntries: MetadataRoute.Sitemap = getPostsSorted().map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  return [...staticEntries, ...postEntries];
}
