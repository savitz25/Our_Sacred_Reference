import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  friendlyStripeError,
  getStripe,
  isStripeConfigured,
} from "@/lib/payments/stripe";
import { getOrCreateStripeCustomer } from "@/lib/payments/customers";
import {
  assertAllowedPaymentMethodTypes,
  paymentIntentPaymentParams,
} from "@/lib/payments/stripe-config";
import { amountForSessionType, getDefaultCurrency } from "@/lib/payments/pricing";
import type { SessionType } from "@/lib/database.types";

export type ChargeResult = {
  success: boolean;
  skipped?: boolean;
  reason?: string;
  paymentIntentId?: string;
  status?: string;
  error?: string;
};

/**
 * Charge a session using the customer's default card (off-session).
 * Used after session completion. Safe to call multiple times (idempotent).
 */
export async function chargeSessionIfEligible(
  sessionId: string
): Promise<ChargeResult> {
  if (!isStripeConfigured()) {
    return {
      success: true,
      skipped: true,
      reason: "stripe_not_configured",
    };
  }

  const admin = createAdminClient();
  const { data: session, error } = await admin
    .from("sessions")
    .select(
      "id, user_id, title, session_type, status, payment_status, amount_cents, currency, stripe_payment_intent_id"
    )
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    return { success: false, error: error?.message || "Session not found" };
  }

  if (session.payment_status === "paid") {
    return {
      success: true,
      skipped: true,
      reason: "already_paid",
      paymentIntentId: session.stripe_payment_intent_id ?? undefined,
    };
  }

  if (session.payment_status === "not_required") {
    return { success: true, skipped: true, reason: "not_required" };
  }

  let amountCents = session.amount_cents;
  const currency = (session.currency || getDefaultCurrency()).toLowerCase();

  if (amountCents == null || amountCents <= 0) {
    const priced = amountForSessionType(session.session_type as SessionType);
    amountCents = priced.amountCents;
    if (amountCents > 0) {
      await admin
        .from("sessions")
        .update({ amount_cents: amountCents, currency: priced.currency })
        .eq("id", sessionId);
    }
  }

  if (!amountCents || amountCents <= 0) {
    return {
      success: true,
      skipped: true,
      reason: "no_amount_configured",
    };
  }

  try {
    const { customerId, profile } = await getOrCreateStripeCustomer(
      session.user_id
    );
    const stripe = getStripe();

    let paymentMethodId = profile.stripe_default_payment_method_id;
    if (!paymentMethodId) {
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer.deleted) {
        const dpm = customer.invoice_settings?.default_payment_method;
        paymentMethodId =
          typeof dpm === "string" ? dpm : dpm?.id ?? null;
      }
    }
    if (!paymentMethodId) {
      const list = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
        limit: 1,
      });
      paymentMethodId = list.data[0]?.id ?? null;
    }

    if (!paymentMethodId) {
      await admin
        .from("sessions")
        .update({
          payment_status: "failed",
          payment_error: "No card on file. Client must add a payment method.",
        })
        .eq("id", sessionId);

      return {
        success: false,
        error: "No card on file for this client.",
      };
    }

    await admin
      .from("sessions")
      .update({ payment_status: "processing", payment_error: null })
      .eq("id", sessionId);

    const paymentParams = paymentIntentPaymentParams();
    assertAllowedPaymentMethodTypes(paymentParams.payment_method_types);

    const idempotencyKey = `session_charge_${sessionId}`;

    const pi = await stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency,
        customer: customerId,
        payment_method: paymentMethodId,
        payment_method_types: [...paymentParams.payment_method_types],
        payment_method_options: paymentParams.payment_method_options,
        confirm: true,
        off_session: true,
        description: session.title || "Sacred Reference session",
        metadata: {
          session_id: sessionId,
          user_id: session.user_id,
          session_type: session.session_type,
          source: "post_session_charge",
        },
      },
      { idempotencyKey }
    );

    await upsertPaymentRecord({
      userId: session.user_id,
      sessionId,
      pi,
      customerId,
    });

    if (pi.status === "succeeded") {
      await markSessionPaid(sessionId, pi.id);
      return {
        success: true,
        paymentIntentId: pi.id,
        status: pi.status,
      };
    }

    if (pi.status === "requires_action") {
      await admin
        .from("sessions")
        .update({
          payment_status: "failed",
          stripe_payment_intent_id: pi.id,
          payment_error:
            "Card requires authentication. Client must complete payment in the portal.",
        })
        .eq("id", sessionId);
      return {
        success: false,
        paymentIntentId: pi.id,
        status: pi.status,
        error: "requires_action",
      };
    }

    await admin
      .from("sessions")
      .update({
        payment_status: "failed",
        stripe_payment_intent_id: pi.id,
        payment_error: `Unexpected PaymentIntent status: ${pi.status}`,
      })
      .eq("id", sessionId);

    return {
      success: false,
      paymentIntentId: pi.id,
      status: pi.status,
      error: pi.status,
    };
  } catch (e) {
    const message = friendlyStripeError(e);
    console.error("[stripe] chargeSessionIfEligible", sessionId, e);

    await admin
      .from("sessions")
      .update({
        payment_status: "failed",
        payment_error: message.slice(0, 500),
      })
      .eq("id", sessionId);

    return { success: false, error: message };
  }
}

/**
 * Create a PaymentIntent for pay-at-booking (client confirms with Payment Element).
 * Card methods only.
 */
export async function createBookingPaymentIntent(input: {
  userId: string;
  sessionId: string;
  amountCents: number;
  currency?: string;
}): Promise<{ clientSecret: string; paymentIntentId: string }> {
  if (!isStripeConfigured()) {
    throw new Error(
      "Card payments are temporarily unavailable. Please try again later."
    );
  }
  if (input.amountCents <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const { customerId } = await getOrCreateStripeCustomer(input.userId);
  const stripe = getStripe();
  const currency = (input.currency || getDefaultCurrency()).toLowerCase();
  const paymentParams = paymentIntentPaymentParams();
  assertAllowedPaymentMethodTypes(paymentParams.payment_method_types);

  const pi = await stripe.paymentIntents.create({
    amount: input.amountCents,
    currency,
    customer: customerId,
    payment_method_types: [...paymentParams.payment_method_types],
    payment_method_options: paymentParams.payment_method_options,
    setup_future_usage: "off_session",
    description: "Sacred Reference session",
    metadata: {
      session_id: input.sessionId,
      user_id: input.userId,
      source: "booking_payment",
    },
  });

  const admin = createAdminClient();
  await admin
    .from("sessions")
    .update({
      amount_cents: input.amountCents,
      currency,
      payment_status: "processing",
      stripe_payment_intent_id: pi.id,
      payment_error: null,
    })
    .eq("id", input.sessionId);

  if (!pi.client_secret) {
    throw new Error("Stripe did not return a client secret");
  }

  return { clientSecret: pi.client_secret, paymentIntentId: pi.id };
}

/**
 * SetupIntent to save a card for future off-session charges.
 */
export async function createSetupIntentForUser(userId: string): Promise<{
  clientSecret: string;
  customerId: string;
}> {
  if (!isStripeConfigured()) {
    throw new Error(
      "Card payments are temporarily unavailable. Please try again later."
    );
  }
  const { customerId } = await getOrCreateStripeCustomer(userId);
  const stripe = getStripe();
  const paymentParams = paymentIntentPaymentParams();
  assertAllowedPaymentMethodTypes(paymentParams.payment_method_types);

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: [...paymentParams.payment_method_types],
    usage: "off_session",
    metadata: {
      user_id: userId,
      source: "portal_save_card",
    },
  });

  if (!setupIntent.client_secret) {
    throw new Error("Stripe did not return a SetupIntent client secret");
  }

  return { clientSecret: setupIntent.client_secret, customerId };
}

export async function markSessionPaid(
  sessionId: string,
  paymentIntentId: string
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("sessions")
    .update({
      payment_status: "paid",
      stripe_payment_intent_id: paymentIntentId,
      charged_at: new Date().toISOString(),
      payment_error: null,
    })
    .eq("id", sessionId);
}

export async function markSessionPaymentFailed(
  sessionId: string,
  paymentIntentId: string | null,
  errorMessage: string
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("sessions")
    .update({
      payment_status: "failed",
      stripe_payment_intent_id: paymentIntentId,
      payment_error: errorMessage.slice(0, 500),
    })
    .eq("id", sessionId);
}

async function upsertPaymentRecord(input: {
  userId: string;
  sessionId: string;
  pi: Stripe.PaymentIntent;
  customerId: string;
}): Promise<void> {
  const admin = createAdminClient();
  const { pi } = input;

  let last4: string | null = null;
  let brand: string | null = null;
  if (pi.payment_method && typeof pi.payment_method === "string") {
    try {
      const pm = await getStripe().paymentMethods.retrieve(pi.payment_method);
      if (pm.card) {
        last4 = pm.card.last4;
        brand = pm.card.brand;
      }
    } catch {
      /* ignore */
    }
  }

  const status =
    pi.status === "succeeded"
      ? "succeeded"
      : pi.status === "canceled"
        ? "canceled"
        : pi.status === "processing"
          ? "processing"
          : "failed";

  const { data: existing } = await admin
    .from("payments")
    .select("id")
    .eq("stripe_payment_intent_id", pi.id)
    .maybeSingle();

  const row = {
    user_id: input.userId,
    session_id: input.sessionId,
    stripe_payment_intent_id: pi.id,
    stripe_customer_id: input.customerId,
    amount_cents: pi.amount,
    currency: pi.currency,
    status: status as
      | "pending"
      | "processing"
      | "succeeded"
      | "failed"
      | "canceled"
      | "refunded",
    payment_method_last4: last4,
    payment_method_brand: brand,
    error_message: null as string | null,
    metadata: { stripe_status: pi.status },
  };

  if (existing?.id) {
    await admin.from("payments").update(row).eq("id", existing.id);
  } else {
    await admin.from("payments").insert(row);
  }
}

