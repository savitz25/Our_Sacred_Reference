import type { SessionType } from "@/lib/database.types";

/**
 * Session pricing (amounts in USD cents).
 * Fees are absorbed by the practice — never auto-added as a surcharge.
 *
 * Configure via env:
 *   STRIPE_SESSION_AMOUNT_CENTS=15000   → $150.00 default for paid sessions
 *   STRIPE_CURRENCY=usd
 *
 * Discovery is always free (amount 0, payment not required).
 * If STRIPE_SESSION_AMOUNT_CENTS is unset or 0, paid types stay "pending"
 * until an amount is set (manual PayPal or future admin amount).
 */

export function getDefaultCurrency(): string {
  return (process.env.STRIPE_CURRENCY || "usd").toLowerCase().trim();
}

/** Default amount for non-discovery sessions (0 = not configured / charge skipped). */
export function getDefaultPaidSessionAmountCents(): number {
  const raw = process.env.STRIPE_SESSION_AMOUNT_CENTS?.trim();
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

export function amountForSessionType(sessionType: SessionType): {
  amountCents: number;
  currency: string;
  paymentRequired: boolean;
} {
  const currency = getDefaultCurrency();
  if (sessionType === "discovery") {
    return { amountCents: 0, currency, paymentRequired: false };
  }
  const amountCents = getDefaultPaidSessionAmountCents();
  return {
    amountCents,
    currency,
    paymentRequired: amountCents > 0,
  };
}

export function formatUsdFromCents(cents: number, currency = "usd"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}
