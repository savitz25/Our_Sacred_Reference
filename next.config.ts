import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Production security headers.
 * CSP allows LiveKit, Supabase, Unsplash, and Resend.
 */
function securityHeaders() {
  const headers = [
    { key: "X-DNS-Prefetch-Control", value: "on" },
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(self), microphone=(self), geolocation=(), interest-cohort=()",
    },
    {
      key: "Content-Security-Policy",
      value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co",
        "font-src 'self' data:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.livekit.cloud wss://*.livekit.cloud https://api.resend.com",
        "media-src 'self' blob: https://*.supabase.co",
        "frame-src 'self'",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'",
        ...(isProd ? ["upgrade-insecure-requests"] : []),
      ].join("; "),
    },
  ];

  if (isProd) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  return headers;
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "mbboakpdxgquntlohlix.supabase.co",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders(),
      },
      {
        source: "/(.*)\\.(js|css|woff2|avif|webp|png|jpg|svg)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/privacy",
        destination: "/privacy-policy",
        permanent: true,
      },
      // Legacy / alternate paths from old site mental models
      {
        source: "/work-with-me",
        destination: "/book-session",
        permanent: true,
      },
      {
        source: "/sessions",
        destination: "/offerings",
        permanent: true,
      },
      {
        source: "/1-1-sessions",
        destination: "/offerings",
        permanent: true,
      },
      {
        source: "/11-sessions",
        destination: "/offerings",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
