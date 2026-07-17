/** Resend + branding defaults for Sacred Reference */

import {
  PRODUCTION_SITE_URL,
  absoluteUrl,
  getSiteUrl,
} from "@/lib/site-url";

export { PRODUCTION_SITE_URL, absoluteUrl, getSiteUrl };

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getResendApiKey(): string | null {
  return process.env.RESEND_API_KEY?.trim() || null;
}

/**
 * Customer-facing sender for all transactional emails.
 * Default: Michele via verified domain.
 */
export function getFromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Michele | Sacred Reference <michele@oursacredreference.com>"
  );
}

/**
 * Practitioner inbox for appointment notifications (new booking, reminders).
 * Always included as a recipient on appointment-related emails.
 */
export function getPractitionerNotifyEmail(): string {
  return (
    process.env.PRACTITIONER_NOTIFY_EMAIL?.trim() ||
    "michele@oursacredreference.com"
  );
}

/** Unique list of recipients (customer + Michele for appointments) */
export function appointmentRecipients(customerEmail: string): string[] {
  const customer = customerEmail.trim().toLowerCase();
  const practitioner = getPractitionerNotifyEmail().toLowerCase();
  const list = [customer];
  if (practitioner && practitioner !== customer) {
    list.push(practitioner);
  }
  return list;
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
