import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

/**
 * Server-only Stripe client. Never import from client components.
 * Throws only when a caller already confirmed Stripe is configured —
 * prefer `isStripeConfigured()` first for user-facing paths.
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(
      "Card payments are temporarily unavailable (missing server key)."
    );
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, {
      apiVersion: "2026-07-29.dahlia",
      typescript: true,
      appInfo: {
        name: "Sacred Reference",
        url: "https://www.oursacredreference.com",
      },
    });
  }
  return stripeSingleton;
}

/** True when publishable + secret keys are present (card UI + charges). */
export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()
  );
}

/** True when webhook signing secret is set (required for /api/webhooks/stripe). */
export function isStripeWebhookConfigured(): boolean {
  return Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());
}

export function getStripePublishableKey(): string | null {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || null;
}

export function getStripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
}

/** Non-throwing env status for health checks / logging (no secret values). */
export function getStripeEnvStatus(): {
  secretKey: boolean;
  publishableKey: boolean;
  webhookSecret: boolean;
  ready: boolean;
  webhookReady: boolean;
} {
  const secretKey = Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  const publishableKey = Boolean(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()
  );
  const webhookSecret = Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());
  return {
    secretKey,
    publishableKey,
    webhookSecret,
    ready: secretKey && publishableKey,
    webhookReady: secretKey && webhookSecret,
  };
}

/**
 * Map Stripe / internal errors to short user-facing copy.
 * Never leak stack traces or secret key hints.
 */
export function friendlyStripeError(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "Something went wrong with the payment.";

  const lower = raw.toLowerCase();

  if (
    lower.includes("missing stripe_secret") ||
    lower.includes("missing server key") ||
    lower.includes("not configured")
  ) {
    return "Card payments are temporarily unavailable. Please try again later or contact Michele.";
  }
  if (lower.includes("no card") || lower.includes("payment method")) {
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
  if (lower.includes("expired")) {
    return "This card appears expired. Please add an updated card.";
  }
  if (lower.includes("rate") || lower.includes("too many")) {
    return "Too many payment attempts. Please wait a moment and try again.";
  }
  // Stripe error messages are usually safe but cap length
  if (raw.length > 180 || lower.includes("sk_") || lower.includes("whsec_")) {
    return "We could not complete the payment. Please try again or contact Michele.";
  }
  return raw;
}
