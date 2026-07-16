"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, X, CheckCircle2 } from "lucide-react";
import { CalendarPlaceholder } from "@/components/booking/CalendarPlaceholder";
import { Button } from "@/components/ui/Button";
import { rescheduleSession } from "@/app/actions/sessions";
import { cn } from "@/lib/utils";

export type RescheduleSessionInfo = {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
};

function toDateIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface RescheduleSessionModalProps {
  session: RescheduleSessionInfo | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export function RescheduleSessionModal({
  session,
  open,
  onClose,
  onSuccess,
}: RescheduleSessionModalProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open && session) {
      setSelectedDate(null);
      setSelectedTime(null);
      setError(null);
      setSuccessMsg(null);
      setSubmitting(false);
    }
  }, [open, session]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitting, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleConfirm = useCallback(async () => {
    if (!session || !selectedDate || !selectedTime) {
      setError("Please select a new date and time.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await rescheduleSession({
        sessionId: session.id,
        date: toDateIso(selectedDate),
        time: selectedTime,
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      });
      if (!result.success) {
        setError(result.error || "Could not reschedule. Please try again.");
        setSubmitting(false);
        return;
      }
      const msg =
        result.message ||
        "Your session has been rescheduled. Michele has been notified.";
      setSuccessMsg(msg);
      onSuccess?.(msg);
      router.refresh();
      // Brief pause so success is readable, then close
      window.setTimeout(() => {
        onClose();
      }, 2200);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }, [session, selectedDate, selectedTime, onSuccess, onClose, router]);

  if (!open || !session) return null;

  const currentWhen = new Date(session.scheduled_at).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-forest-deep/60 backdrop-blur-sm"
        aria-label="Close reschedule dialog"
        onClick={() => !submitting && onClose()}
      />

      <div
        className={cn(
          "relative z-10 w-full max-w-2xl max-h-[92vh] overflow-y-auto",
          "rounded-t-3xl sm:rounded-3xl border border-border bg-cream shadow-elevated"
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-cream/95 backdrop-blur-sm px-5 sm:px-6 py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-teal mb-1">
              Reschedule
            </p>
            <h2
              id="reschedule-title"
              className="font-serif text-xl sm:text-2xl text-forest leading-snug"
            >
              {session.title}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Currently scheduled:{" "}
              <span className="text-ink font-medium">{currentWhen}</span>
              {session.duration_minutes
                ? ` · ${session.duration_minutes} min`
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            className="shrink-0 rounded-full p-2 text-muted hover:bg-forest/5 hover:text-forest transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 sm:px-6 py-5 space-y-5">
          {successMsg ? (
            <div className="rounded-2xl border border-teal/25 bg-teal/10 px-5 py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-teal mx-auto mb-3" />
              <p className="font-serif text-xl text-forest mb-2">
                Session rescheduled
              </p>
              <p className="text-sm text-ink-soft leading-relaxed max-w-md mx-auto">
                {successMsg}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-ink-soft leading-relaxed">
                Choose a new weekday and time from live availability. Your
                session room, library, and any past recordings stay linked to
                this same session. A confirmation goes to you and Michele; the
                1-hour reminder will use the new time.
              </p>

              <CalendarPlaceholder
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                excludeSessionId={session.id}
                onSelectSlot={(date, time) => {
                  setSelectedDate(date);
                  setSelectedTime(time);
                  setError(null);
                }}
              />

              {error && (
                <p
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-1 pb-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="gold"
                  onClick={() => void handleConfirm()}
                  disabled={submitting || !selectedDate || !selectedTime}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Saving…
                    </>
                  ) : (
                    <>
                      <CalendarClock className="h-4 w-4" aria-hidden />
                      Confirm new time
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
