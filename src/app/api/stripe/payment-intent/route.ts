import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStripeConfigured } from "@/lib/payments/stripe";
import { createBookingPaymentIntent } from "@/lib/payments/charge";
import { amountForSessionType, formatUsdFromCents } from "@/lib/payments/pricing";

/**
 * POST { sessionId, amountCents? } — PaymentIntent for pay-at-booking (card only).
 */
export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      sessionId?: string;
      amountCents?: number;
    };

    if (!body.sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: session, error } = await admin
      .from("sessions")
      .select("id, user_id, session_type, payment_status, amount_cents, currency")
      .eq("id", body.sessionId)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (session.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (session.payment_status === "paid") {
      return NextResponse.json(
        { error: "Session already paid" },
        { status: 400 }
      );
    }

    const priced = amountForSessionType(session.session_type);
    const amountCents =
      body.amountCents && body.amountCents > 0
        ? body.amountCents
        : session.amount_cents && session.amount_cents > 0
          ? session.amount_cents
          : priced.amountCents;

    if (amountCents <= 0) {
      return NextResponse.json(
        {
          error:
            "No amount configured for this session. Set STRIPE_SESSION_AMOUNT_CENTS or pass amountCents.",
        },
        { status: 400 }
      );
    }

    const { clientSecret, paymentIntentId } = await createBookingPaymentIntent({
      userId: user.id,
      sessionId: session.id,
      amountCents,
      currency: session.currency || priced.currency,
    });

    return NextResponse.json({
      clientSecret,
      paymentIntentId,
      amountCents,
      currency: session.currency || priced.currency,
      amountLabel: formatUsdFromCents(
        amountCents,
        session.currency || priced.currency
      ),
      paymentMethodTypes: ["card"],
    });
  } catch (e) {
    console.error("[api/stripe/payment-intent]", e);
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "PaymentIntent failed",
      },
      { status: 500 }
    );
  }
}
