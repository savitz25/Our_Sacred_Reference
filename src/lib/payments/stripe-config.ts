/**
 * Stripe payment configuration for Sacred Reference.
 *
 * Policy (product + legal / ops):
 * - Stripe is the primary online processor.
 * - Surface **card** payments only by default (international cards supported).
 * - Optionally allow **ACH** (US bank account) when enabled for domestic clients.
 * - Do **not** enable PayPal, Venmo, or other wallet methods that stack extra fees
 *   or duplicate a manual PayPal flow Michele may send clients separately.
 * - Do **not** automatically pass Stripe processing fees to the client.
 *   Session prices stay simple; fee absorption is the default.
 *
 * Wire this module into Checkout Session / PaymentIntent creation when Stripe
 * is integrated (see `checkoutSessionPaymentParams` / `paymentIntentPaymentParams`).
 */

/** Methods clients may see in Stripe Checkout / Payment Element. */
export const STRIPE_ALLOWED_PAYMENT_METHOD_TYPES = [
  "card",
  // ACH: enable when domestic bank debit is ready in Dashboard + product UX.
  // Keep listed here as optional; include only when `includeAch` is true.
] as const;

export type StripeAllowedPaymentMethod = "card" | "us_bank_account";

/** Explicitly excluded — never pass these to Checkout or Payment Element. */
export const STRIPE_EXCLUDED_PAYMENT_METHODS = [
  "paypal",
  "venmo",
  "cashapp",
  "klarna",
  "afterpay_clearpay",
  "affirm",
  "amazon_pay",
  "link", // optional: can re-enable if desired; not fee-stacking but keep UI simple
] as const;

/**
 * Fee policy: practice absorbs Stripe fees by default.
 * Never add a surcharge line item or `application_fee` that marks up for
 * processing costs unless product explicitly opts into a future package model.
 */
export const STRIPE_FEE_POLICY = {
  /** Client-facing prices are the full amount charged; no fee passthrough. */
  passFeesToClient: false,
  /** Do not add automatic processing-fee line items. */
  addProcessingFeeLineItem: false,
  notes:
    "International clients are common; keep pricing simple. PayPal (when wanted) is a manual link from Michele outside Stripe.",
} as const;

export type StripeCheckoutPaymentOptions = {
  /** Include US ACH (us_bank_account). Default false until product enables it. */
  includeAch?: boolean;
};

/**
 * Params to spread into `stripe.checkout.sessions.create({ ... })`.
 * Forces an allow-list so Dashboard defaults cannot re-enable PayPal/Venmo.
 */
export function checkoutSessionPaymentParams(
  options: StripeCheckoutPaymentOptions = {}
): {
  payment_method_types: StripeAllowedPaymentMethod[];
  /** Prefer Payment Element methods only from this allow-list. */
  payment_method_options?: {
    card?: { request_three_d_secure?: "automatic" };
  };
} {
  const methods: StripeAllowedPaymentMethod[] = ["card"];
  if (options.includeAch) {
    methods.push("us_bank_account");
  }

  return {
    payment_method_types: methods,
    payment_method_options: {
      // 3DS when required — good default for international cards
      card: { request_three_d_secure: "automatic" },
    },
  };
}

/**
 * Params to spread into `stripe.paymentIntents.create({ ... })`
 * when using Payment Element (not hosted Checkout).
 */
export function paymentIntentPaymentParams(
  options: StripeCheckoutPaymentOptions = {}
): {
  payment_method_types: StripeAllowedPaymentMethod[];
  payment_method_options?: {
    card?: { request_three_d_secure?: "automatic" };
  };
} {
  return checkoutSessionPaymentParams(options);
}

/**
 * Runtime guard: reject any payment method type that must stay off the UI.
 */
export function assertAllowedPaymentMethodTypes(
  types: readonly string[]
): void {
  const excluded = new Set(
    STRIPE_EXCLUDED_PAYMENT_METHODS.map((m) => m.toLowerCase())
  );
  for (const t of types) {
    if (excluded.has(t.toLowerCase())) {
      throw new Error(
        `Stripe payment method "${t}" is disabled for Sacred Reference. Use card (or ACH when enabled). PayPal should be a manual link outside Stripe.`
      );
    }
  }
}
