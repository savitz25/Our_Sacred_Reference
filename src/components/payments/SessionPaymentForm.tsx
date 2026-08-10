"use client";

import { useMemo, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createSessionPaymentIntentAction } from "@/app/actions/payments";

const publishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const elementsAppearance: StripeElementsOptions["appearance"] = {
  theme: "stripe",
  variables: {
    colorPrimary: "#1e3d32",
    colorBackground: "#faf6f0",
    colorText: "#1a1a1a",
    colorDanger: "#b91c1c",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "12px",
  },
};

/**
 * Optional pay-at-booking / pay-now form for a session (card only).
 */
export function SessionPaymentForm({
  sessionId,
  onPaid,
}: {
  sessionId: string;
  onPaid?: () => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amountLabel, setAmountLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function startPayment() {
    setError(null);
    setLoading(true);
    const result = await createSessionPaymentIntentAction({ sessionId });
    setLoading(false);
    if (!result.success || !result.clientSecret) {
      setError(result.error ?? "Could not start payment");
      return;
    }
    setClientSecret(result.clientSecret);
    setAmountLabel(result.amountLabel ?? null);
  }

  if (!stripePromise) {
    return null;
  }

  if (done) {
    return (
      <Card className="border-teal/30 bg-teal/5">
        <p className="text-sm text-forest font-medium">
          Payment received. Thank you.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="font-serif text-lg text-forest mb-2">Pay for this session</h3>
      <p className="text-sm text-ink-soft mb-4">
        Credit or debit card only. International cards are supported. Processing
        fees are not added on top of the session price.
      </p>

      {!clientSecret ? (
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={loading}
          onClick={startPayment}
        >
          {loading ? "Preparing…" : "Pay with card"}
        </Button>
      ) : (
        <>
          {amountLabel && (
            <p className="text-sm font-medium text-forest mb-3">
              Amount: {amountLabel}
            </p>
          )}
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: elementsAppearance }}
          >
            <PayForm
              onSuccess={() => {
                setDone(true);
                onPaid?.();
              }}
              onError={setError}
            />
          </Elements>
        </>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </Card>
  );
}

function PayForm({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const paymentElementOptions = useMemo(
    () => ({
      layout: "tabs" as const,
      wallets: {
        applePay: "never" as const,
        googlePay: "never" as const,
      },
    }),
    []
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      onError(submitError.message || "Please check your card details.");
      setSubmitting(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url:
          typeof window !== "undefined"
            ? `${window.location.origin}/portal?paid=1`
            : undefined,
      },
    });

    if (error) {
      onError(error.message || "Payment failed. Please try again.");
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      onSuccess();
    } else {
      onError(
        `Payment status: ${paymentIntent?.status ?? "unknown"}. If you were charged, contact Michele.`
      );
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={paymentElementOptions} />
      <Button type="submit" variant="primary" disabled={!stripe || submitting}>
        {submitting ? "Processing…" : "Pay now"}
      </Button>
    </form>
  );
}
