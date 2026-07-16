"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckCircle2 } from "lucide-react";

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
  const [submitted, setSubmitted] = useState(false);
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
    selectedTime;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitted(true);
    onComplete?.();
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-teal/30 bg-teal/5 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-teal mb-4" aria-hidden />
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
          . A welcome email with portal access and your session link will be
          sent to <strong>{form.email}</strong>.
        </p>
        <p className="mt-4 text-sm text-muted">
          Account auto-creation mock — in production this creates your secure
          portal credentials and calendar invite.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button href="/login" variant="primary">
            Go to Login
          </Button>
          <Button href="/portal" variant="outline">
            Preview Portal
          </Button>
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
          Basic demographics and consent. Your account is created automatically
          after booking.
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

      <Button type="submit" variant="gold" className="w-full" disabled={!canSubmit}>
        Confirm Free Discovery Session
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
        className="w-full rounded-xl border border-border bg-cream/40 px-4 py-2.5 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
      />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
