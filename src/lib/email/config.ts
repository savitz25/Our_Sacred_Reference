/** Resend + branding defaults for Sacred Reference */

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getResendApiKey(): string | null {
  return process.env.RESEND_API_KEY?.trim() || null;
}

/**
 * Verified sender. Prefer domain email after DNS verification in Resend.
 * Default: hello@oursacredreference.com
 */
export function getFromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Sacred Reference <hello@oursacredreference.com>"
  );
}

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

export const BRAND = {
  name: "Sacred Reference",
  forest: "#0A3D33",
  gold: "#D4A017",
  cream: "#F5F0E8",
  teal: "#2A8C7E",
  ink: "#1a2e28",
  muted: "#6b7c75",
} as const;
