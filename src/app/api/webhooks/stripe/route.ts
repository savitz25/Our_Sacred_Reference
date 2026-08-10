import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getStripe,
  getStripeEnvStatus,
  getStripeWebhookSecret,
  isStripeConfigured,
} from "@/lib/payments/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  markSessionPaid,
  markSessionPaymentFailed,
} from "@/lib/payments/charge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook — raw body + signature verification via STRIPE_WEBHOOK_SECRET.
 *
 * Production URL:
 *   https://www.oursacredreference.com/api/webhooks/stripe
 *
 * Subscribe to:
 *   payment_intent.succeeded
 *   payment_intent.payment_failed
 *   setup_intent.succeeded
 *   charge.refunded
 */

/** Lightweight status (no secrets) for ops checks. */
export async function GET() {
  const status = getStripeEnvStatus();
  return NextResponse.json({
    ok: true,
    endpoint: "/api/webhooks/stripe",
    method: "POST",
    stripeReady: status.ready,
    webhookReady: status.webhookReady,
    events: [
      "payment_intent.succeeded",
      "payment_intent.payment_failed",
      "setup_intent.succeeded",
      "charge.refunded",
    ],
  });
}

export async function POST(request: Request) {
  const secret = getStripeWebhookSecret();
  if (!secret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 503 }
    );
  }

  if (!isStripeConfigured() && !process.env.STRIPE_SECRET_KEY?.trim()) {
    console.error("[stripe webhook] STRIPE_SECRET_KEY not set");
    return NextResponse.json(
      { error: "Stripe secret key not configured" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (e) {
    console.error("[stripe webhook] failed to read body", e);
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (e) {
    console.error("[stripe webhook] signature verification failed", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.info("[stripe webhook] received", event.type, event.id);

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      }
      case "payment_intent.payment_failed": {
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      }
      case "setup_intent.succeeded": {
        await handleSetupSucceeded(event.data.object as Stripe.SetupIntent);
        break;
      }
      case "charge.refunded": {
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      }
      default:
        console.info("[stripe webhook] ignored event", event.type);
        break;
    }

    return NextResponse.json({ received: true, type: event.type, id: event.id });
  } catch (e) {
    console.error("[stripe webhook] handler error", event.type, event.id, e);
    // 500 so Stripe retries transient failures
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Handler failed" },
      { status: 500 }
    );
  }
}

async function resolveUserId(input: {
  metadataUserId?: string | null;
  customerId?: string | null;
}): Promise<string | null> {
  if (input.metadataUserId) return input.metadataUserId;
  if (!input.customerId) return null;

  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", input.customerId)
      .maybeSingle();
    return profile?.id ?? null;
  } catch (e) {
    console.error("[stripe webhook] resolveUserId", e);
    return null;
  }
}

function customerIdFrom(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

async function handlePaymentSucceeded(pi: Stripe.PaymentIntent) {
  const sessionId = pi.metadata?.session_id || null;
  const customerId = customerIdFrom(pi.customer);
  const userId = await resolveUserId({
    metadataUserId: pi.metadata?.user_id || null,
    customerId,
  });

  if (sessionId) {
    try {
      await markSessionPaid(sessionId, pi.id);
    } catch (e) {
      console.error("[stripe webhook] markSessionPaid", sessionId, e);
      throw e;
    }
  } else {
    // Fallback: match by existing PI id on a session
    try {
      const admin = createAdminClient();
      const { data: session } = await admin
        .from("sessions")
        .select("id")
        .eq("stripe_payment_intent_id", pi.id)
        .maybeSingle();
      if (session?.id) {
        await markSessionPaid(session.id, pi.id);
      }
    } catch (e) {
      console.error("[stripe webhook] session lookup by PI", e);
    }
  }

  if (!userId) {
    console.warn(
      "[stripe webhook] payment_intent.succeeded without resolvable user",
      pi.id
    );
    return;
  }

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

  await upsertPaymentRow({
    userId,
    sessionId,
    pi,
    customerId,
    status: "succeeded",
    last4,
    brand,
    errorMessage: null,
  });
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  const sessionId = pi.metadata?.session_id || null;
  const message =
    pi.last_payment_error?.message ||
    "Payment failed. Please update your card in the portal.";

  if (sessionId) {
    try {
      await markSessionPaymentFailed(sessionId, pi.id, message);
    } catch (e) {
      console.error("[stripe webhook] markSessionPaymentFailed", sessionId, e);
    }
  } else {
    try {
      const admin = createAdminClient();
      const { data: session } = await admin
        .from("sessions")
        .select("id")
        .eq("stripe_payment_intent_id", pi.id)
        .maybeSingle();
      if (session?.id) {
        await markSessionPaymentFailed(session.id, pi.id, message);
      }
    } catch (e) {
      console.error("[stripe webhook] failed session lookup by PI", e);
    }
  }

  const customerId = customerIdFrom(pi.customer);
  const userId = await resolveUserId({
    metadataUserId: pi.metadata?.user_id || null,
    customerId,
  });

  if (!userId) {
    console.warn(
      "[stripe webhook] payment_intent.payment_failed without resolvable user",
      pi.id
    );
    return;
  }

  await upsertPaymentRow({
    userId,
    sessionId,
    pi,
    customerId,
    status: "failed",
    last4: null,
    brand: null,
    errorMessage: message.slice(0, 500),
  });
}

async function handleSetupSucceeded(si: Stripe.SetupIntent) {
  const pmId =
    typeof si.payment_method === "string"
      ? si.payment_method
      : si.payment_method?.id ?? null;

  if (!pmId) {
    console.warn("[stripe webhook] setup_intent.succeeded missing PM", si.id);
    return;
  }

  const customerId = customerIdFrom(si.customer);
  const userId = await resolveUserId({
    metadataUserId: si.metadata?.user_id || null,
    customerId,
  });

  if (!userId) {
    console.warn(
      "[stripe webhook] setup_intent.succeeded without resolvable user",
      si.id
    );
    return;
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    console.warn("[stripe webhook] profile missing for setup", userId);
    return;
  }

  const stripeCustomerId = profile.stripe_customer_id || customerId;

  if (stripeCustomerId) {
    try {
      await getStripe().customers.update(stripeCustomerId, {
        invoice_settings: { default_payment_method: pmId },
      });
    } catch (e) {
      console.error("[stripe webhook] set default PM on customer", e);
    }
  }

  const { error } = await admin
    .from("profiles")
    .update({
      stripe_default_payment_method_id: pmId,
      ...(stripeCustomerId && !profile.stripe_customer_id
        ? { stripe_customer_id: stripeCustomerId }
        : {}),
    })
    .eq("id", userId);

  if (error) {
    console.error("[stripe webhook] profile update after setup", error.message);
    throw new Error(error.message);
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const piId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id ?? null;

  if (!piId) return;

  const admin = createAdminClient();

  const { error: payErr } = await admin
    .from("payments")
    .update({ status: "refunded" })
    .eq("stripe_payment_intent_id", piId);

  if (payErr) {
    console.error("[stripe webhook] refund payment row", payErr.message);
  }

  const { data: session } = await admin
    .from("sessions")
    .select("id")
    .eq("stripe_payment_intent_id", piId)
    .maybeSingle();

  if (session) {
    const { error: sessErr } = await admin
      .from("sessions")
      .update({ payment_status: "refunded" })
      .eq("id", session.id);
    if (sessErr) {
      console.error("[stripe webhook] refund session", sessErr.message);
    }
  }
}

async function upsertPaymentRow(input: {
  userId: string;
  sessionId: string | null;
  pi: Stripe.PaymentIntent;
  customerId: string | null;
  status: "succeeded" | "failed" | "processing" | "pending" | "canceled" | "refunded";
  last4: string | null;
  brand: string | null;
  errorMessage: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  const { pi } = input;

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
    status: input.status,
    payment_method_last4: input.last4,
    payment_method_brand: input.brand,
    error_message: input.errorMessage,
    metadata: {
      source: pi.metadata?.source ?? null,
      stripe_status: pi.status,
    },
  };

  if (existing?.id) {
    const { error } = await admin
      .from("payments")
      .update(row)
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from("payments").insert(row);
    if (error) throw new Error(error.message);
  }
}
