import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  friendlyStripeError,
  isStripeConfigured,
} from "@/lib/payments/stripe";
import { createSetupIntentForUser } from "@/lib/payments/charge";

/**
 * POST — create a SetupIntent for the authenticated user (save card, card-only).
 */
export async function POST() {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error:
            "Card payments are temporarily unavailable. Please try again later.",
        },
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

    const { clientSecret, customerId } = await createSetupIntentForUser(
      user.id
    );

    return NextResponse.json({
      clientSecret,
      customerId,
      paymentMethodTypes: ["card"],
    });
  } catch (e) {
    console.error("[api/stripe/setup-intent]", e);
    return NextResponse.json(
      { error: friendlyStripeError(e) },
      { status: 500 }
    );
  }
}
