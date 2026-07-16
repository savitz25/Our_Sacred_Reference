"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { bookDiscoverySession } from "@/app/actions/booking";

interface IntakeFormProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onComplete?: () => void;
}

export function IntakeForm({
  selectedDate,
  selectedTime,
  onComplete,
}: IntakeFormProps) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
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
    consent: false,
  });

  const canSubmit =
    form.firstName &&
    form.lastName &&
    form.email &&
    form.password.length >= 8 &&
    form.consent &&
    selectedDate &&
    selectedTime &&
    !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !selectedDate || !selectedTime) return;

    setLoading(true);
    setError(null);

    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedDate.getDate()).padStart(2, "0");

    const result = await bookDiscoverySession({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || undefined,
      password: form.password,
      intention: form.intention || undefined,
      consent: form.consent,
      date: `${y}-${m}-${d}`,
      time: selectedTime,
      sessionType: "discovery",
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Booking failed");
      return;
    }

    setSessionId(result.sessionId ?? null);
    setMessage(result.message ?? null);
    setSubmitted(true);
    onComplete?.();
    router.refresh();
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
          .
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
        />
        <Field
          label="Last name"
          id="lastName"
          required
          value={form.lastName}
          onChange={(v) => setForm((f) => ({ ...f, lastName: v }))}
        />
      </div>

      <Field
        label="Email"
        id="email"
        type="email"
        required
        value={form.email}
        onChange={(v) => setForm((f) => ({ ...f, email: v }))}
      />

      <Field
        label="Phone (optional)"
        id="phone"
        type="tel"
        value={form.phone}
        onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
      />

      <Field
        label="Create password"
        id="password"
        type="password"
        required
        hint="At least 8 characters — used for portal login"
        value={form.password}
        onChange={(v) => setForm((f) => ({ ...f, password: v }))}
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
          value={form.intention}
          onChange={(e) =>
            setForm((f) => ({ ...f, intention: e.target.value }))
          }
          className="w-full rounded-xl border border-border bg-cream/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
          placeholder="Share anything you'd like Michele to know before your discovery session..."
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) =>
            setForm((f) => ({ ...f, consent: e.target.checked }))
          }
          className="mt-1 h-4 w-4 rounded border-border text-teal focus:ring-teal"
          required
        />
        <span className="text-sm text-ink-soft leading-relaxed">
          I consent to receiving session communications and understand this is
          not a crisis service. I agree to the privacy practices described on
          this site.
        </span>
      </label>

      {error && (
        <p
          className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
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
            Creating account & booking…
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
}: {
  label: string;
  id: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        minLength={type === "password" ? 8 : undefined}
        className="w-full rounded-xl border border-border bg-cream/40 px-4 py-2.5 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
      />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
