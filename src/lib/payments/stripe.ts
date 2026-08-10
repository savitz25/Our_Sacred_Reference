import Stripe from "stripe";
import {
  inspectPublishableKey,
  inspectSecretKey,
  logStripeKeyDiagnostics,
  sanitizeStripeKey,
  type StripeKeyInspection,
} from "@/lib/payments/stripe-keys";

let stripeSingleton: Stripe | null = null;
let stripeSingletonKey: string | null = null;

function rawSecretKey(): string {
  return sanitizeStripeKey(process.env.STRIPE_SECRET_KEY);
}

function rawPublishableKey(): string {
  return sanitizeStripeKey(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

/**
 * Server-only Stripe client. Never import from client components.
 * Prefer `isStripeConfigured()` first for user-facing paths.
 */
export function getStripe(): Stripe {
  const key = rawSecretKey();
  if (!key) {
    throw new Error(
      "Card payments are temporarily unavailable (missing server key)."
    );
  }

  const sk = inspectSecretKey(key);
  if (!sk.looksValid) {
    logStripeKeyDiagnostics("getStripe_invalid_secret", inspectPublishableKey(rawPublishableKey()), sk);
    throw new Error(
      "Card payments are temporarily unavailable (invalid server key)."
    );
  }

  // Recreate client if secret rotated between deploys in same process (rare)
  if (!stripeSingleton || stripeSingletonKey !== key) {
    stripeSingleton = new Stripe(key, {
      apiVersion: "2026-07-29.dahlia",
      typescript: true,
      appInfo: {
        name: "Sacred Reference",
        url: "https://www.oursacredreference.com",
      },
    });
    stripeSingletonKey = key;
  }
  return stripeSingleton;
}

/** True when both keys are present and look structurally valid (same mode). */
export function isStripeConfigured(): boolean {
  const status = getStripeEnvStatus();
  return status.ready;
}

/** True when webhook signing secret is set. */
export function isStripeWebhookConfigured(): boolean {
  return Boolean(sanitizeStripeKey(process.env.STRIPE_WEBHOOK_SECRET));
}

/** Sanitized publishable key for Stripe.js (never secret). */
export function getStripePublishableKey(): string | null {
  const key = rawPublishableKey();
  if (!key) return null;
  const inspection = inspectPublishableKey(key);
  if (!inspection.looksValid) {
    logStripeKeyDiagnostics("publishable_invalid", inspection, inspectSecretKey(rawSecretKey()));
    return null;
  }
  return key;
}

export function getStripeWebhookSecret(): string | null {
  const secret = sanitizeStripeKey(process.env.STRIPE_WEBHOOK_SECRET);
  return secret || null;
}

export type StripeEnvStatus = {
  secretKey: boolean;
  publishableKey: boolean;
  webhookSecret: boolean;
  ready: boolean;
  webhookReady: boolean;
  /** Shape diagnostics only — no full keys */
  publishable: StripeKeyInspection;
  secret: StripeKeyInspection;
  modeMatch: boolean;
  mode: "test" | "live" | "mixed" | "unknown";
};

/** Non-throwing env status for health checks / logging (no secret values). */
export function getStripeEnvStatus(): StripeEnvStatus {
  const pub = inspectPublishableKey(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  const secret = inspectSecretKey(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = Boolean(
    sanitizeStripeKey(process.env.STRIPE_WEBHOOK_SECRET)
  );

  const modeMatch =
    pub.mode !== "unknown" &&
    secret.mode !== "unknown" &&
    pub.mode === secret.mode;

  const mode: StripeEnvStatus["mode"] =
    !pub.present && !secret.present
      ? "unknown"
      : pub.mode === secret.mode
        ? pub.mode
        : pub.mode !== "unknown" && secret.mode !== "unknown"
          ? "mixed"
          : pub.mode !== "unknown"
            ? pub.mode
            : secret.mode !== "unknown"
              ? secret.mode
              : "unknown";

  const ready =
    pub.looksValid &&
    secret.looksValid &&
    modeMatch;

  return {
    secretKey: secret.present,
    publishableKey: pub.present,
    webhookSecret,
    ready,
    webhookReady: secret.looksValid && webhookSecret,
    publishable: pub,
    secret: {
      present: secret.present,
      prefix: secret.prefix,
      length: secret.length,
      mode: secret.mode,
      looksValid: secret.looksValid,
      issues: secret.issues,
    },
    modeMatch,
    mode,
  };
}

/**
 * Map Stripe / internal errors to short user-facing copy.
 * Never leak full keys or secret material.
 */
export function friendlyStripeError(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "Something went wrong with the payment.";

  const lower = raw.toLowerCase();

  // Never surface raw key fragments to the user
  if (
    lower.includes("invalid api key") ||
    lower.includes("invalid_api_key") ||
    lower.includes("pk_live_") ||
    lower.includes("pk_test_") ||
    lower.includes("sk_live_") ||
    lower.includes("sk_test_")
  ) {
    return "Stripe is not configured correctly. Please contact support.";
  }
  if (
    lower.includes("missing stripe_secret") ||
    lower.includes("missing server key") ||
    lower.includes("invalid server key") ||
    lower.includes("not configured")
  ) {
    return "Card payments are temporarily unavailable. Please try again later or contact Michele.";
  }
  if (lower.includes("mode") && lower.includes("mismatch")) {
    return "Stripe is not configured correctly. Please contact support.";
  }
  if (lower.includes("no card") || lower.includes("no payment method")) {
    return "No card on file. Please add a card under Profile → Payment method.";
  }
  if (
    lower.includes("card was declined") ||
    lower.includes("card_declined") ||
    lower.includes("insufficient_funds")
  ) {
    return "Your card was declined. Please try another card or contact your bank.";
  }
  if (
    lower.includes("authentication") ||
    lower.includes("requires_action") ||
    lower.includes("3d secure")
  ) {
    return "Your bank requires extra verification. Please complete payment in the portal with your card present.";
  }
  if (lower.includes("expired") && lower.includes("card")) {
    return "This card appears expired. Please add an updated card.";
  }
  if (lower.includes("rate") || lower.includes("too many")) {
    return "Too many payment attempts. Please wait a moment and try again.";
  }
  if (raw.length > 180 || lower.includes("whsec_")) {
    return "We could not complete the payment. Please try again or contact Michele.";
  }
  return raw;
}

/** Log key diagnostics once on first payment action (server only). */
export function ensureStripeKeyDiagnosticsLogged(): void {
  const status = getStripeEnvStatus();
  logStripeKeyDiagnostics("env", status.publishable, status.secret);
  if (!status.modeMatch && status.publishable.present && status.secret.present) {
    console.error(
      "[stripe-keys] MODE MISMATCH: publishable and secret keys are not both test or both live"
    );
  }
}
