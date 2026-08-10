"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { isStripeConfigured } from "@/lib/payments/stripe";
import {
  createBookingPaymentIntent,
  createSetupIntentForUser,
  chargeSessionIfEligible,
} from "@/lib/payments/charge";
import {
  getDefaultPaymentMethodSummary,
  setDefaultPaymentMethod,
} from "@/lib/payments/customers";
import { createAdminClient } from "@/lib/supabase/admin";
import { amountForSessionType, formatUsdFromCents } from "@/lib/payments/pricing";

export async function createSetupIntentAction(): Promise<{
  success: boolean;
  clientSecret?: string;
  error?: string;
}> {
  try {
    if (!isStripeConfigured()) {
      return {
        success: false,
        error: "Card payments are not configured yet. Please try again later.",
      };
    }
    const user = await requireUser("/portal/profile");
    const { clientSecret } = await createSetupIntentForUser(user.id);
    return { success: true, clientSecret };
  } catch (e) {
    console.error("[payments] createSetupIntentAction", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Could not start card setup",
    };
  }
}

export async function saveDefaultPaymentMethodAction(
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!paymentMethodId?.startsWith("pm_")) {
      return { success: false, error: "Invalid payment method." };
    }
    const user = await requireUser("/portal/profile");
    await setDefaultPaymentMethod(user.id, paymentMethodId);
    revalidatePath("/portal/profile");
    return { success: true };
  } catch (e) {
    console.error("[payments] saveDefaultPaymentMethodAction", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Could not save card",
    };
  }
}

export async function getPaymentMethodSummaryAction(): Promise<{
  success: boolean;
  hasCard?: boolean;
  brand?: string | null;
  last4?: string | null;
  expMonth?: number | null;
  expYear?: number | null;
  stripeReady?: boolean;
  error?: string;
}> {
  try {
    const stripeReady = isStripeConfigured();
    if (!stripeReady) {
      return { success: true, stripeReady: false, hasCard: false };
    }
    const user = await requireUser("/portal/profile");
    const summary = await getDefaultPaymentMethodSummary(user.id);
    return {
      success: true,
      stripeReady: true,
      hasCard: summary?.hasCard ?? false,
      brand: summary?.brand ?? null,
      last4: summary?.last4 ?? null,
      expMonth: summary?.expMonth ?? null,
      expYear: summary?.expYear ?? null,
    };
  } catch (e) {
    console.error("[payments] getPaymentMethodSummaryAction", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Could not load payment method",
    };
  }
}

/**
 * Create a PaymentIntent for charging at booking (client confirms with Payment Element).
 * Only for authenticated users who own the session.
 */
export async function createSessionPaymentIntentAction(input: {
  sessionId: string;
  amountCents?: number;
}): Promise<{
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  amountLabel?: string;
  error?: string;
}> {
  try {
    if (!isStripeConfigured()) {
      return { success: false, error: "Card payments are not configured." };
    }
    const user = await requireUser();
    const admin = createAdminClient();
    const { data: session, error } = await admin
      .from("sessions")
      .select("id, user_id, session_type, payment_status, amount_cents, currency")
      .eq("id", input.sessionId)
      .single();

    if (error || !session) {
      return { success: false, error: "Session not found." };
    }
    if (session.user_id !== user.id) {
      return { success: false, error: "You do not own this session." };
    }
    if (session.payment_status === "paid") {
      return { success: false, error: "This session is already paid." };
    }

    const priced = amountForSessionType(session.session_type);
    const amountCents =
      input.amountCents && input.amountCents > 0
        ? input.amountCents
        : session.amount_cents && session.amount_cents > 0
          ? session.amount_cents
          : priced.amountCents;

    if (amountCents <= 0) {
      return {
        success: false,
        error:
          "No session amount is configured. Contact Michele for payment details.",
      };
    }

    const { clientSecret, paymentIntentId } = await createBookingPaymentIntent({
      userId: user.id,
      sessionId: session.id,
      amountCents,
      currency: session.currency || priced.currency,
    });

    return {
      success: true,
      clientSecret,
      paymentIntentId,
      amountLabel: formatUsdFromCents(amountCents, session.currency || priced.currency),
    };
  } catch (e) {
    console.error("[payments] createSessionPaymentIntentAction", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Could not start payment",
    };
  }
}

/**
 * Practitioner: manually trigger post-session charge for a session.
 */
export async function adminChargeSessionAction(sessionId: string): Promise<{
  success: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
}> {
  try {
    const user = await requireUser("/admin");
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["practitioner", "admin"].includes(profile.role)) {
      return { success: false, error: "Unauthorized" };
    }

    if (!isStripeConfigured()) {
      return { success: false, error: "Stripe is not configured." };
    }

    const result = await chargeSessionIfEligible(sessionId);
    revalidatePath("/admin");
    return {
      success: result.success,
      skipped: result.skipped,
      reason: result.reason,
      error: result.error,
    };
  } catch (e) {
    console.error("[payments] adminChargeSessionAction", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Charge failed",
    };
  }
}
