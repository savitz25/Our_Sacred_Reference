import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, getStripeWebhookSecret } from "@/lib/payments/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  markSessionPaid,
  markSessionPaymentFailed,
} from "@/lib/payments/charge";

export const runtime = "nodejs";

/**
 * Stripe webhook — signature verified with STRIPE_WEBHOOK_SECRET.
 * Handles payment success/failure and card attachment events.
 *
 * Dashboard: Developers → Webhooks → Add endpoint
 * URL: https://www.oursacredreference.com/api/webhooks/stripe
 * Events: payment_intent.succeeded, payment_intent.payment_failed,
 *         setup_intent.succeeded, charge.refunded
 */
export async function POST(request: Request) {
  const secret = getStripeWebhookSecret();
  if (!secret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (e) {
    console.error("[stripe webhook] signature verification failed", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(pi);
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(pi);
        break;
      }
      case "setup_intent.succeeded": {
        const si = event.data.object as Stripe.SetupIntent;
        await handleSetupSucceeded(si);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }
      default:
        // Ignore other events
        break;
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[stripe webhook] handler error", event.type, e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Handler failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(pi: Stripe.PaymentIntent) {
  const sessionId = pi.metadata?.session_id;
  const userId = pi.metadata?.user_id;
  const admin = createAdminClient();

  if (sessionId) {
    await markSessionPaid(sessionId, pi.id);
  }

  const status = "succeeded" as const;
  let last4: string | null = null;
  let brand: string | null = null;

  if (typeof pi.payment_method === "string") {
    try {
      const pm = await getStripe().paymentMethods.retrieve(pi.payment_method);
      last4 = pm.card?.last4 ?? null;
      brand = pm.card?.brand ?? null;
    } catch {
      /* ignore */
    }
  }

  const { data: existing } = await admin
    .from("payments")
    .select("id")
    .eq("stripe_payment_intent_id", pi.id)
    .maybeSingle();

  const row = {
    user_id: userId || "00000000-0000-0000-0000-000000000000",
    session_id: sessionId || null,
    stripe_payment_intent_id: pi.id,
    stripe_customer_id:
      typeof pi.customer === "string" ? pi.customer : pi.customer?.id ?? null,
    amount_cents: pi.amount,
    currency: pi.currency,
    status,
    payment_method_last4: last4,
    payment_method_brand: brand,
    error_message: null as string | null,
    metadata: { source: pi.metadata?.source ?? null },
  };

  // Prefer profile lookup by customer if user_id missing
  if (!userId && row.stripe_customer_id) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", row.stripe_customer_id)
      .maybeSingle();
    if (profile) row.user_id = profile.id;
  }

  if (row.user_id === "00000000-0000-0000-0000-000000000000") {
    console.warn("[stripe webhook] no user for PI", pi.id);
    return;
  }

  if (existing?.id) {
    await admin.from("payments").update(row).eq("id", existing.id);
  } else {
    await admin.from("payments").insert(row);
  }
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  const sessionId = pi.metadata?.session_id;
  const message =
    pi.last_payment_error?.message || "Payment failed. Please update your card.";

  if (sessionId) {
    await markSessionPaymentFailed(sessionId, pi.id, message);
  }

  const admin = createAdminClient();
  const userId = pi.metadata?.user_id;
  if (!userId) return;

  const { data: existing } = await admin
    .from("payments")
    .select("id")
    .eq("stripe_payment_intent_id", pi.id)
    .maybeSingle();

  const row = {
    user_id: userId,
    session_id: sessionId || null,
    stripe_payment_intent_id: pi.id,
    stripe_customer_id:
      typeof pi.customer === "string" ? pi.customer : pi.customer?.id ?? null,
    amount_cents: pi.amount,
    currency: pi.currency,
    status: "failed" as const,
    payment_method_last4: null as string | null,
    payment_method_brand: null as string | null,
    error_message: message.slice(0, 500),
    metadata: { stripe_status: pi.status },
  };

  if (existing?.id) {
    await admin.from("payments").update(row).eq("id", existing.id);
  } else {
    await admin.from("payments").insert(row);
  }
}

async function handleSetupSucceeded(si: Stripe.SetupIntent) {
  const userId = si.metadata?.user_id;
  const pmId =
    typeof si.payment_method === "string"
      ? si.payment_method
      : si.payment_method?.id;

  if (!userId || !pmId) return;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return;

  const stripe = getStripe();
  const customerId =
    profile.stripe_customer_id ||
    (typeof si.customer === "string" ? si.customer : si.customer?.id);

  if (customerId) {
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: pmId },
    });
  }

  await admin
    .from("profiles")
    .update({
      stripe_default_payment_method_id: pmId,
      ...(customerId && !profile.stripe_customer_id
        ? { stripe_customer_id: customerId }
        : {}),
    })
    .eq("id", userId);
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const piId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!piId) return;

  const admin = createAdminClient();
  await admin
    .from("payments")
    .update({ status: "refunded" })
    .eq("stripe_payment_intent_id", piId);

  const { data: session } = await admin
    .from("sessions")
    .select("id")
    .eq("stripe_payment_intent_id", piId)
    .maybeSingle();

  if (session) {
    await admin
      .from("sessions")
      .update({ payment_status: "refunded" })
      .eq("id", session.id);
  }
}
