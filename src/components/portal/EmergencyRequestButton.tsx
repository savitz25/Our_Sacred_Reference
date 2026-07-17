"use client";

import { useState, useTransition } from "react";
import { AlertCircle, HeartHandshake, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { submitEmergencyRequest } from "@/app/actions/emergency";
import { cn } from "@/lib/utils";

export function EmergencyRequestButton() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await submitEmergencyRequest({ reason });
      if (!res.success) {
        setError(res.error || "Could not send request.");
        return;
      }
      setSuccess(
        res.message ||
          "Your request was sent. Michele will propose a time by email."
      );
      setReason("");
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError(null);
          setSuccess(null);
        }}
        className={cn(
          "w-full rounded-2xl border border-gold/40 bg-gradient-to-br from-forest to-forest-light",
          "px-5 py-4 text-left text-cream shadow-elevated transition-all",
          "hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        )}
      >
        <span className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold-soft">
            <HeartHandshake className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block font-serif text-lg sm:text-xl text-cream">
              Emergency Session Request
            </span>
            <span className="mt-1 block text-sm text-cream/75 leading-relaxed">
              Need support sooner? Request an immediate or near-term session with
              Michele. She will propose a time for you to accept.
            </span>
          </span>
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="emergency-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-forest-deep/55 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => !pending && setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-border bg-cream shadow-elevated">
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-teal mb-1">
                  Sacred support
                </p>
                <h2
                  id="emergency-title"
                  className="font-serif text-xl sm:text-2xl text-forest"
                >
                  Emergency Session Request
                </h2>
              </div>
              <button
                type="button"
                onClick={() => !pending && setOpen(false)}
                className="rounded-full p-2 text-muted hover:bg-forest/5"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-5 space-y-4">
              {success ? (
                <div className="rounded-2xl border border-teal/30 bg-teal/10 px-4 py-5 text-center">
                  <HeartHandshake className="mx-auto mb-3 h-8 w-8 text-teal" />
                  <p className="font-serif text-lg text-forest mb-2">Request sent</p>
                  <p className="text-sm text-ink-soft leading-relaxed">{success}</p>
                  <Button
                    type="button"
                    variant="gold"
                    className="mt-5"
                    onClick={() => setOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-sm text-ink-soft leading-relaxed">
                    This is for moments when you need presence sooner than a
                    scheduled appointment. Michele will receive your request and
                    propose either an instant meeting or a short delay. You will
                    confirm by email.
                  </p>
                  <div>
                    <label
                      htmlFor="emergency-reason"
                      className="block text-sm font-medium text-forest mb-1.5"
                    >
                      What would help right now?{" "}
                      <span className="text-muted font-normal">(optional)</span>
                    </label>
                    <textarea
                      id="emergency-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={4}
                      maxLength={1000}
                      placeholder="A few words about what is arising — only if you wish."
                      className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
                    />
                  </div>
                  {error && (
                    <p
                      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                      role="alert"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      {error}
                    </p>
                  )}
                  <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={pending}
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="gold" disabled={pending}>
                      {pending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        "Send emergency request"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
