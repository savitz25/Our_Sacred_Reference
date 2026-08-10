/**
 * Client-side Stripe.js loader — fetches sanitized publishable key from the server
 * so we never rely solely on a build-time env value that may have quotes/truncation.
 */

import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  clientFacingKeyError,
  inspectPublishableKey,
  sanitizeStripeKey,
} from "@/lib/payments/stripe-keys";

export type StripeBrowserConfig = {
  ok: boolean;
  publishableKey: string | null;
  mode: string | null;
  message: string | null;
  publishable?: {
    present: boolean;
    prefix: string | null;
    length: number;
    mode: string;
    looksValid: boolean;
    issues: string[];
  };
};

let cachedPromise: Promise<Stripe | null> | null = null;
let cachedKey: string | null = null;

/**
 * Load Stripe.js with a validated publishable key.
 * Prefers `/api/stripe/config` (runtime, sanitized); falls back to NEXT_PUBLIC.
 */
export async function loadStripeBrowser(): Promise<{
  stripe: Stripe | null;
  error: string | null;
  config: StripeBrowserConfig | null;
}> {
  try {
    const res = await fetch("/api/stripe/config", {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = (await res.json()) as StripeBrowserConfig & {
      publishableKey?: string | null;
    };

    const fromApi = sanitizeStripeKey(data.publishableKey ?? null);
    const fromEnv = sanitizeStripeKey(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    );
    const key = fromApi || fromEnv;

    if (typeof window !== "undefined") {
      const inspection = inspectPublishableKey(key);
      console.info(
        "[stripe-browser] pk present=%s prefix=%s len=%s mode=%s valid=%s issues=%s source=%s",
        inspection.present,
        inspection.prefix,
        inspection.length,
        inspection.mode,
        inspection.looksValid,
        inspection.issues.join(",") || "none",
        fromApi ? "api" : fromEnv ? "env" : "none"
      );
    }

    if (!key) {
      return {
        stripe: null,
        error:
          data.message ||
          "Stripe is not configured correctly. Please contact support.",
        config: data,
      };
    }

    const inspection = inspectPublishableKey(key);
    if (!inspection.looksValid) {
      return {
        stripe: null,
        error: clientFacingKeyError(inspection),
        config: data,
      };
    }

    if (!cachedPromise || cachedKey !== key) {
      cachedKey = key;
      cachedPromise = loadStripe(key);
    }

    const stripe = await cachedPromise;
    if (!stripe) {
      return {
        stripe: null,
        error: "Stripe is not configured correctly. Please contact support.",
        config: data,
      };
    }

    return { stripe, error: null, config: data };
  } catch (e) {
    console.error("[stripe-browser] load failed", e);
    return {
      stripe: null,
      error: "Stripe is not configured correctly. Please contact support.",
      config: null,
    };
  }
}

/** Map Stripe.js errors so users never see raw key material. */
export function friendlyBrowserStripeError(message: string | undefined): string {
  const raw = message || "Something went wrong.";
  const lower = raw.toLowerCase();
  if (
    lower.includes("invalid api key") ||
    lower.includes("invalid_api_key") ||
    lower.includes("pk_live_") ||
    lower.includes("pk_test_") ||
    lower.includes("sk_")
  ) {
    return "Stripe is not configured correctly. Please contact support.";
  }
  return raw;
}
