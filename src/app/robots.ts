import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/portal",
          "/portal/",
          "/admin",
          "/admin/",
          "/api/",
          "/auth/",
          "/login",
        ],
      },
      {
        // Be explicit for common bots
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/portal", "/portal/", "/admin", "/admin/", "/api/", "/auth/", "/login"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
