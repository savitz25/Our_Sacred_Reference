"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { Stripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  createSetupIntentAction,
  getPaymentMethodSummaryAction,
  saveDefaultPaymentMethodAction,
} from "@/app/actions/payments";
import {
  friendlyBrowserStripeError,
  loadStripeBrowser,
} from "@/lib/payments/stripe-browser";

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
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [debugHint, setDebugHint] = useState<string | null>(null);
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
    try {
      const summary = await getPaymentMethodSummaryAction();
      if (!summary.success) {
        // Do not block the form — card list is optional; setup can still work
        console.warn("[PaymentMethodSection] summary failed", summary.error);
        setError(
          friendlyBrowserStripeError(
            summary.error ?? "Could not load saved card details"
          )
        );
        return;
      }
      setHasCard(Boolean(summary.hasCard));
      setBrand(summary.brand ?? null);
      setLast4(summary.last4 ?? null);
      setExpMonth(summary.expMonth ?? null);
      setExpYear(summary.expYear ?? null);
    } catch (e) {
      console.warn("[PaymentMethodSection] summary threw", e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      console.info("[PaymentMethodSection] loading Stripe.js…");
      const result = await loadStripeBrowser();
      if (cancelled) return;

      if (result.error || !result.stripe) {
        const hint = [
          result.config?.ok === false ? "config_ok=false" : null,
          result.config?.publishable
            ? `pk_len=${result.config.publishable.length} pk_valid=${result.config.publishable.looksValid}`
            : null,
          result.error ? `err=${result.error.slice(0, 80)}` : null,
        ]
          .filter(Boolean)
          .join(" ");
        console.error(
          "[PaymentMethodSection] Stripe.js failed to load",
          result.error,
          result.config
        );
        setConfigError(
          result.error ||
            "Stripe is not configured correctly. Please contact support."
        );
        setDebugHint(hint || null);
        setStripe(null);
      } else {
        console.info("[PaymentMethodSection] Stripe.js ready");
        setStripe(result.stripe);
        setConfigError(null);
        setDebugHint(null);
      }

      await refreshSummary();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshSummary]);

  async function startAddCard() {
    setError(null);
    setMessage(null);

    if (!stripe) {
      setError(
        configError ||
          "Stripe is not configured correctly. Please contact support."
      );
      return;
    }

    setShowForm(true);
    const result = await createSetupIntentAction();
    if (!result.success || !result.clientSecret) {
      console.error("[PaymentMethodSection] setup intent failed", result.error);
      setError(
        friendlyBrowserStripeError(
          result.error ?? "Could not start card setup"
        )
      );
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

  // Only show “not configured” when Stripe.js truly failed — not when summary is empty
  if (!stripe || configError) {
    return (
      <Card>
        <h2 className="font-serif text-xl text-forest mb-2">Payment method</h2>
        <p className="text-sm text-ink-soft leading-relaxed">
          {configError ||
            "Secure card payments will appear here once Stripe is configured correctly. You can still book free discovery sessions. For other payment options (including a direct PayPal link when Michele sends one), she will contact you personally."}
        </p>
        {process.env.NODE_ENV === "development" && debugHint && (
          <p className="mt-2 text-xs text-muted font-mono">{debugHint}</p>
        )}
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
            stripe={stripe}
            options={{
              clientSecret,
              appearance: elementsAppearance,
              paymentMethodCreation: "manual",
            }}
          >
            <SetupForm
              onSuccess={async (pmId) => {
                const saved = await saveDefaultPaymentMethodAction(pmId);
                if (!saved.success) {
                  setError(
                    friendlyBrowserStripeError(
                      saved.error ?? "Could not save card"
                    )
                  );
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
              onError={(msg) => setError(friendlyBrowserStripeError(msg))}
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
