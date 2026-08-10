"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  createSetupIntentAction,
  getPaymentMethodSummaryAction,
  saveDefaultPaymentMethodAction,
} from "@/app/actions/payments";

const publishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || "";

const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

/** Forest / gold / cream Payment Element appearance */
const elementsAppearance: StripeElementsOptions["appearance"] = {
  theme: "stripe",
  variables: {
    colorPrimary: "#1e3d32",
    colorBackground: "#faf6f0",
    colorText: "#1a1a1a",
    colorDanger: "#b91c1c",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "12px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid #e5ddd0",
      boxShadow: "none",
    },
    ".Input:focus": {
      border: "1px solid #2a6b5a",
      boxShadow: "0 0 0 2px rgba(42, 107, 90, 0.2)",
    },
    ".Label": {
      fontWeight: "500",
    },
  },
};

export function PaymentMethodSection() {
  const [loading, setLoading] = useState(true);
  const [stripeReady, setStripeReady] = useState(false);
  const [hasCard, setHasCard] = useState(false);
  const [brand, setBrand] = useState<string | null>(null);
  const [last4, setLast4] = useState<string | null>(null);
  const [expMonth, setExpMonth] = useState<number | null>(null);
  const [expYear, setExpYear] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refreshSummary = useCallback(async () => {
    const summary = await getPaymentMethodSummaryAction();
    if (!summary.success) {
      setError(summary.error ?? "Could not load payment method");
      setLoading(false);
      return;
    }
    setStripeReady(Boolean(summary.stripeReady));
    setHasCard(Boolean(summary.hasCard));
    setBrand(summary.brand ?? null);
    setLast4(summary.last4 ?? null);
    setExpMonth(summary.expMonth ?? null);
    setExpYear(summary.expYear ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshSummary();
  }, [refreshSummary]);

  async function startAddCard() {
    setError(null);
    setMessage(null);
    setShowForm(true);
    const result = await createSetupIntentAction();
    if (!result.success || !result.clientSecret) {
      setError(result.error ?? "Could not start card setup");
      setShowForm(false);
      return;
    }
    setClientSecret(result.clientSecret);
  }

  if (loading) {
    return (
      <Card>
        <h2 className="font-serif text-xl text-forest mb-2">Payment method</h2>
        <p className="text-sm text-muted">Loading…</p>
      </Card>
    );
  }

  if (!stripeReady || !stripePromise) {
    return (
      <Card>
        <h2 className="font-serif text-xl text-forest mb-2">Payment method</h2>
        <p className="text-sm text-ink-soft leading-relaxed">
          Secure card payments will appear here once Stripe is configured. You
          can still book free discovery sessions. For other payment options
          (including a direct PayPal link when Michele sends one), she will
          contact you personally.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="font-serif text-xl text-forest mb-2">Payment method</h2>
      <p className="text-sm text-ink-soft leading-relaxed mb-4">
        Save a credit or debit card for paid sessions. International cards are
        welcome. Session prices are as quoted — processing fees are not added on
        top. Only card payments are accepted here (no PayPal or Venmo in this
        form).
      </p>

      {hasCard && last4 && (
        <div className="mb-4 rounded-xl border border-teal/25 bg-teal/5 px-4 py-3">
          <p className="text-sm font-medium text-forest">
            Card on file
            {brand ? `: ${brand.charAt(0).toUpperCase()}${brand.slice(1)}` : ""}{" "}
            ···· {last4}
          </p>
          {expMonth && expYear && (
            <p className="text-xs text-muted mt-0.5">
              Expires {String(expMonth).padStart(2, "0")}/{expYear}
            </p>
          )}
        </div>
      )}

      {!showForm && (
        <Button type="button" variant="outline" size="sm" onClick={startAddCard}>
          {hasCard ? "Update card" : "Add card"}
        </Button>
      )}

      {showForm && clientSecret && (
        <div className="mt-4">
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: elementsAppearance,
              // Card-only — do not surface wallets that stack fees
              paymentMethodCreation: "manual",
            }}
          >
            <SetupForm
              onSuccess={async (pmId) => {
                const saved = await saveDefaultPaymentMethodAction(pmId);
                if (!saved.success) {
                  setError(saved.error ?? "Could not save card");
                  return;
                }
                setMessage("Your card has been saved securely.");
                setShowForm(false);
                setClientSecret(null);
                await refreshSummary();
              }}
              onCancel={() => {
                setShowForm(false);
                setClientSecret(null);
              }}
              onError={(msg) => setError(msg)}
            />
          </Elements>
        </div>
      )}

      {showForm && !clientSecret && (
        <p className="text-sm text-muted mt-3">Preparing secure form…</p>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-3 text-sm text-teal" role="status">
          {message}
        </p>
      )}
    </Card>
  );
}

function SetupForm({
  onSuccess,
  onCancel,
  onError,
}: {
  onSuccess: (paymentMethodId: string) => Promise<void>;
  onCancel: () => void;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const paymentElementOptions = useMemo(
    () => ({
      layout: "tabs" as const,
      // wallets off — cards only
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
    onError("");

    const { error: submitError } = await elements.submit();
    if (submitError) {
      onError(submitError.message || "Please check your card details.");
      setSubmitting(false);
      return;
    }

    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
      confirmParams: {
        // Card-only; no return_url needed with if_required unless 3DS
        return_url:
          typeof window !== "undefined"
            ? `${window.location.origin}/portal/profile?card=saved`
            : undefined,
      },
    });

    if (error) {
      onError(error.message || "Card could not be saved. Please try again.");
      setSubmitting(false);
      return;
    }

    const pm =
      typeof setupIntent?.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent?.payment_method?.id;

    if (!pm) {
      onError("Card setup completed but no payment method was returned.");
      setSubmitting(false);
      return;
    }

    await onSuccess(pm);
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={paymentElementOptions} />
      <div className="flex flex-wrap gap-3 pt-1">
        <Button type="submit" variant="primary" disabled={!stripe || submitting}>
          {submitting ? "Saving…" : "Save card securely"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={submitting}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
      <p className="text-xs text-muted">
        Payments are processed by Stripe. Card details never touch Sacred
        Reference servers.
      </p>
    </form>
  );
}
