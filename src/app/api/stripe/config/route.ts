import { NextResponse } from "next/server";
import {
  ensureStripeKeyDiagnosticsLogged,
  getStripeEnvStatus,
  getStripePublishableKey,
} from "@/lib/payments/stripe";

/**
 * Public Stripe.js config — publishable key only (never secret).
 * Returns a sanitized key so client loadStripe avoids truncated/quoted env values.
 */
export async function GET() {
  try {
    ensureStripeKeyDiagnosticsLogged();
    const status = getStripeEnvStatus();
    const publishableKey = getStripePublishableKey();

    return NextResponse.json({
      ok: status.ready && Boolean(publishableKey),
      configured: status.ready,
      mode: status.mode,
      modeMatch: status.modeMatch,
      /** Full publishable key is public by design; still only returned if shape-valid */
      publishableKey: publishableKey,
      publishable: {
        present: status.publishable.present,
        prefix: status.publishable.prefix,
        length: status.publishable.length,
        mode: status.publishable.mode,
        looksValid: status.publishable.looksValid,
        issues: status.publishable.issues,
      },
      secret: {
        present: status.secret.present,
        prefix: status.secret.prefix,
        length: status.secret.length,
        mode: status.secret.mode,
        looksValid: status.secret.looksValid,
        issues: status.secret.issues,
      },
      message: !status.ready
        ? "Stripe is not configured correctly. Please contact support."
        : null,
    });
  } catch (e) {
    console.error("[api/stripe/config]", e);
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        publishableKey: null,
        message: "Stripe is not configured correctly. Please contact support.",
      },
      { status: 503 }
    );
  }
}
