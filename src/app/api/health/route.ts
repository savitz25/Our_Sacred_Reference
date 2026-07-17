import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Lightweight health check for uptime monitors and deploy verification.
 * Does not expose secrets.
 */
export async function GET() {
  const resolvedSiteUrl = getSiteUrl();
  const checks = {
    ok: true,
    timestamp: new Date().toISOString(),
    env: {
      supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      supabaseAnon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      siteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
      /** Resolved public origin used in emails/links (never localhost) */
      resolvedSiteUrl,
      livekit: Boolean(
        process.env.LIVEKIT_API_KEY &&
          process.env.LIVEKIT_API_SECRET &&
          process.env.NEXT_PUBLIC_LIVEKIT_URL
      ),
      supabaseS3: Boolean(
        process.env.SUPABASE_S3_ACCESS_KEY && process.env.SUPABASE_S3_SECRET_KEY
      ),
      resend: Boolean(process.env.RESEND_API_KEY),
    },
  };

  const criticalOk =
    checks.env.supabaseUrl && checks.env.supabaseAnon && checks.env.serviceRole;

  return NextResponse.json(
    {
      ...checks,
      ok: criticalOk,
      status: criticalOk ? "ready" : "misconfigured",
    },
    { status: criticalOk ? 200 : 503 }
  );
}
