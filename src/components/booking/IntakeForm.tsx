"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { bookDiscoverySession } from "@/app/actions/booking";
import { informedConsentCheckboxLabel } from "@/lib/legal";

interface IntakeFormProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onComplete?: () => void;
}

type LoadingStep =
  | null
  | "Creating your account…"
  | "Saving your session…"
  | "Finishing up…";

export function IntakeForm({
  selectedDate,
  selectedTime,
  onComplete,
}: IntakeFormProps) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<LoadingStep>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    intention: "",
    communicationsConsent: false,
    informedConsent: false,
  });

  const canSubmit =
    form.firstName &&
    form.lastName &&
    form.email &&
    form.password.length >= 8 &&
    form.communicationsConsent &&
    form.informedConsent &&
    selectedDate &&
    selectedTime &&
    !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      setError("Please select a date and time on the calendar first.");
      return;
    }
    if (!form.informedConsent || !form.communicationsConsent) {
      setError("Please accept both consent checkboxes to continue.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setLoadingStep("Creating your account…");
    setError(null);

    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedDate.getDate()).padStart(2, "0");

    // Soft client-side timeout so UI never hangs forever
    const CLIENT_TIMEOUT_MS = 35_000;
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
    }, CLIENT_TIMEOUT_MS);

    try {
      // Brief step progress (visual only — single server round-trip)
      const stepTimer = window.setTimeout(
        () => setLoadingStep("Saving your session…"),
        1200
      );
      const stepTimer2 = window.setTimeout(
        () => setLoadingStep("Finishing up…"),
        4000
      );

      const result = await bookDiscoverySession({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        intention: form.intention.trim() || undefined,
        consent: form.communicationsConsent,
        informedConsent: form.informedConsent,
        date: `${y}-${m}-${d}`,
        time: selectedTime,
        sessionType: "discovery",
        // Critical for same-day slots on Vercel (UTC server)
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      });

      window.clearTimeout(stepTimer);
      window.clearTimeout(stepTimer2);
      window.clearTimeout(timeoutId);

      if (timedOut) {
        // Response arrived after timeout UI — still process it
      }

      if (!result || typeof result !== "object") {
        setError(
          "We did not receive a valid response from the server. Please try again."
        );
        return;
      }

      if (!result.success) {
        setError(
          result.error ||
            "Booking could not be completed. Please check your details and try again."
        );
        return;
      }

      setSessionId(result.sessionId ?? null);
      setMessage(result.message ?? null);
      setSubmitted(true);
      onComplete?.();
      try {
        router.refresh();
      } catch {
        /* ignore */
      }
    } catch (err) {
      window.clearTimeout(timeoutId);
      console.error("[IntakeForm] booking error:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Something went wrong while booking.";
      if (
        timedOut ||
        msg.toLowerCase().includes("timeout") ||
        msg.toLowerCase().includes("fetch")
      ) {
        setError(
          "The request took too long or lost connection. Please try again. If the problem continues, email us or try signing in if an account was created."
        );
      } else {
        setError(
          msg.length > 180
            ? "We could not complete your booking. Please try again or contact us."
            : msg
        );
      }
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-teal/30 bg-teal/5 p-8 text-center">
        <CheckCircle2
          className="mx-auto h-12 w-12 text-teal mb-4"
          aria-hidden
        />
        <h3 className="font-serif text-2xl text-forest mb-2">
          You&apos;re confirmed
        </h3>
        <p className="text-ink-soft leading-relaxed max-w-md mx-auto">
          Your free discovery session is scheduled for{" "}
          <strong>
            {selectedDate?.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}{" "}
            at {selectedTime}
          </strong>
          . Your portal account is ready
          {form.email ? (
            <>
              {" "}
              for <strong>{form.email}</strong>
            </>
          ) : null}
          . Your Informed Consent has been recorded.
        </p>
        {message && (
          <p className="mt-3 text-sm text-teal-muted">{message}</p>
        )}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button href="/portal" variant="gold">
            Open portal
          </Button>
          {sessionId && (
            <Button href={`/portal/session/${sessionId}`} variant="outline">
              Session details
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-soft space-y-5"
      noValidate
    >
      <div>
        <h3 className="font-serif text-xl text-forest">Secure intake</h3>
        <p className="mt-1 text-sm text-muted">
          We create your portal account automatically when you book.
        </p>
      </div>

      {!selectedDate || !selectedTime ? (
        <p className="rounded-xl bg-cream-dark/60 px-4 py-3 text-sm text-ink-soft">
          Please select a date and time on the calendar first.
        </p>
      ) : (
        <p className="rounded-xl bg-teal/10 px-4 py-3 text-sm text-teal-muted">
          Booking:{" "}
          {selectedDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}{" "}
          at {selectedTime}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="First name"
          id="firstName"
          required
          value={form.firstName}
          onChange={(v) => setForm((f) => ({ ...f, firstName: v }))}
          disabled={loading}
        />
        <Field
          label="Last name"
          id="lastName"
          required
          value={form.lastName}
          onChange={(v) => setForm((f) => ({ ...f, lastName: v }))}
          disabled={loading}
        />
      </div>

      <Field
        label="Email"
        id="email"
        type="email"
        required
        value={form.email}
        onChange={(v) => setForm((f) => ({ ...f, email: v }))}
        disabled={loading}
      />

      <Field
        label="Phone (optional)"
        id="phone"
        type="tel"
        value={form.phone}
        onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
        disabled={loading}
      />

      <Field
        label="Create password"
        id="password"
        type="password"
        required
        hint="At least 8 characters — used for portal login"
        value={form.password}
        onChange={(v) => setForm((f) => ({ ...f, password: v }))}
        disabled={loading}
      />

      <div>
        <label
          htmlFor="intention"
          className="block text-sm font-medium text-ink mb-1.5"
        >
          What brings you to this work? (optional)
        </label>
        <textarea
          id="intention"
          rows={3}
          disabled={loading}
          value={form.intention}
          onChange={(e) =>
            setForm((f) => ({ ...f, intention: e.target.value }))
          }
          className="w-full rounded-xl border border-border bg-cream/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 disabled:opacity-60"
          placeholder="Share anything you'd like Michele to know before your discovery session..."
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          disabled={loading}
          checked={form.communicationsConsent}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              communicationsConsent: e.target.checked,
            }))
          }
          className="mt-1 h-4 w-4 rounded border-border text-teal focus:ring-teal"
          required
        />
        <span className="text-sm text-ink-soft leading-relaxed">
          I consent to receiving session communications and understand this is
          not a crisis service. I agree to the{" "}
          <Link
            href="/privacy-policy"
            className="text-teal hover:underline"
            target="_blank"
          >
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-gold/40 bg-cream-dark/40 p-4">
        <input
          type="checkbox"
          disabled={loading}
          checked={form.informedConsent}
          onChange={(e) =>
            setForm((f) => ({ ...f, informedConsent: e.target.checked }))
          }
          className="mt-1 h-4 w-4 rounded border-border text-teal focus:ring-teal"
          required
          aria-required="true"
          id="informedConsent"
        />
        <span className="text-sm text-ink leading-relaxed">
          {informedConsentCheckboxLabel}{" "}
          <Link
            href="/consent"
            className="text-teal font-medium hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read full Informed Consent
          </Link>
          .
        </span>
      </label>

      {error && (
        <div
          className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 flex gap-2"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="font-medium">Booking could not be completed</p>
            <p className="mt-1">{error}</p>
            <p className="mt-2 text-xs text-red-600/80">
              Already have an account?{" "}
              <Link href="/login" className="underline font-medium">
                Sign in
              </Link>{" "}
              then book again, or contact us for help.
            </p>
          </div>
        </div>
      )}

      {loading && loadingStep && (
        <p className="text-center text-sm text-teal-muted" aria-live="polite">
          {loadingStep}
        </p>
      )}

      <Button
        type="submit"
        variant="gold"
        className="w-full"
        disabled={!canSubmit}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {loadingStep || "Creating account & booking…"}
          </>
        ) : (
          "Confirm Free Discovery Session"
        )}
      </Button>
    </form>
  );
}

function Field({
  label,
  id,
  type = "text",
  required,
  value,
  onChange,
  hint,
  disabled,
}: {
  label: string;
  id: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink mb-1.5">
        {label}
        {required && <span className="text-teal ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        minLength={type === "password" ? 8 : undefined}
        className="w-full rounded-xl border border-border bg-cream/40 px-4 py-2.5 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 disabled:opacity-60"
      />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
