"use client";

import Link from "next/link";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function EmergencyPortalBanner({
  flag,
  message,
  sessionId,
}: {
  flag?: string;
  message?: string;
  sessionId?: string;
}) {
  if (!flag) return null;

  if (flag === "accepted") {
    return (
      <div
        className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-teal/30 bg-teal/10 px-5 py-4"
        role="status"
      >
        <CheckCircle2 className="h-6 w-6 text-teal shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-forest">Emergency session accepted</p>
          <p className="text-sm text-ink-soft mt-0.5">
            {message ||
              "Your session is confirmed. Join when ready — delayed sessions also receive a 1-hour reminder when applicable."}
          </p>
        </div>
        {sessionId && (
          <Button href={`/portal/session/${sessionId}`} variant="gold" size="sm">
            Open session room
          </Button>
        )}
      </div>
    );
  }

  if (flag === "declined") {
    return (
      <div
        className="mb-8 flex items-start gap-3 rounded-2xl border border-border bg-cream-dark/50 px-5 py-4"
        role="status"
      >
        <XCircle className="h-5 w-5 text-muted shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-forest">Proposal declined</p>
          <p className="text-sm text-ink-soft mt-0.5">
            {message ||
              "Michele has been notified. You may request again if you still need support."}
          </p>
        </div>
      </div>
    );
  }

  if (flag === "error") {
    return (
      <div
        className="mb-8 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4"
        role="alert"
      >
        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-red-900">Could not process link</p>
          <p className="text-sm text-red-800/90 mt-0.5">
            {message || "This emergency response link is invalid or expired."}{" "}
            <Link href="/portal" className="underline">
              Return to portal
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return null;
}
