/**
 * Single source of truth for public site URLs (emails, auth redirects, SEO).
 *
 * Always prefers `NEXT_PUBLIC_SITE_URL` when it is a real public HTTPS origin.
 * Never returns localhost, 127.0.0.1, or unrelated domains for customer-facing links.
 */

/** Canonical production origin — no trailing slash */
export const PRODUCTION_SITE_URL = "https://www.oursacredreference.com";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function isUnusablePublicOrigin(url: string): boolean {
  return (
    !url ||
    /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(url) ||
    /movetrusthub/i.test(url) ||
    !/^https:\/\//i.test(url)
  );
}

/**
 * Resolve the public site origin for emails, booking links, magic-link redirects,
 * reminders, recording notifications, and other absolute URLs.
 *
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL if valid HTTPS public origin
 * 2. Normalize apex oursacredreference.com → www
 * 3. PRODUCTION_SITE_URL fallback
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    const site = stripTrailingSlash(raw);
    if (!isUnusablePublicOrigin(site)) {
      if (site === "https://oursacredreference.com") {
        return PRODUCTION_SITE_URL;
      }
      return site;
    }
  }

  // Vercel system URL is a last-resort only when not localhost — prefer canonical prod
  const vercel = process.env.VERCEL_URL?.trim();
  if (
    vercel &&
    process.env.VERCEL_ENV === "production" &&
    !/localhost|127\.0\.0\.1/i.test(vercel)
  ) {
    // Prefer branded domain over *.vercel.app for emails when env is missing
    if (vercel.includes("oursacredreference")) {
      return `https://${stripTrailingSlash(vercel)}`;
    }
  }

  return PRODUCTION_SITE_URL;
}

/** Build an absolute path on the public site (path may start with / or not). */
export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
