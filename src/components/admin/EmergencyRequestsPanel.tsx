"use client";

import { useState, useTransition } from "react";
import {
  HeartHandshake,
  Loader2,
  Clock,
  Zap,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  proposeEmergencySession,
  type EmergencyDelayMinutes,
  type EmergencyRequestAdminRow,
} from "@/app/actions/emergency";
import { cn } from "@/lib/utils";

const DELAYS: { value: EmergencyDelayMinutes; label: string }[] = [
  { value: 0, label: "Instant" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
];

export function EmergencyRequestsPanel({
  requests: initial,
}: {
  requests: EmergencyRequestAdminRow[];
}) {
  const [requests, setRequests] = useState(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [delay, setDelay] = useState<EmergencyDelayMinutes>(0);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const pendingCount = requests.filter(
    (r) => r.status === "pending" || r.status === "proposed"
  ).length;

  function handlePropose(requestId: string) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await proposeEmergencySession({
        requestId,
        delayMinutes: delay,
        practitionerNote: note,
      });
      if (!res.success) {
        setError(res.error || "Could not send proposal.");
        return;
      }
      setSuccess(res.message || "Proposal sent.");
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: "proposed",
                delay_minutes: delay,
                proposed_at: new Date(
                  Date.now() + delay * 60 * 1000
                ).toISOString(),
                session_id: res.sessionId ?? r.session_id,
              }
            : r
        )
      );
      setExpandedId(null);
      setNote("");
      setDelay(0);
    });
  }

  if (!requests.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center">
        <HeartHandshake className="mx-auto mb-3 h-8 w-8 text-muted" />
        <p className="font-serif text-lg text-forest">No emergency requests</p>
        <p className="mt-1 text-sm text-muted">
          Client emergency session requests will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-ink-soft">
          <span className="font-medium text-forest">{pendingCount}</span> open ·{" "}
          {requests.length} total recent
        </p>
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
      {success && (
        <p className="flex items-center gap-2 rounded-xl border border-teal/30 bg-teal/10 px-3 py-2 text-sm text-forest">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-teal" />
          {success}
        </p>
      )}

      <ul className="space-y-3">
        {requests.map((r) => {
          const isOpen = expandedId === r.id;
          const canPropose =
            r.status === "pending" || r.status === "proposed";
          return (
            <li
              key={r.id}
              className="rounded-2xl border border-border bg-white p-4 sm:p-5 shadow-soft"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-muted">
                      {new Date(r.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="font-medium text-ink">
                    {r.client_name || "Client"}
                  </p>
                  <p className="text-sm text-muted">{r.client_email}</p>
                  {r.reason && (
                    <p className="mt-2 text-sm text-ink-soft leading-relaxed rounded-xl bg-cream/80 border border-border/60 px-3 py-2">
                      {r.reason}
                    </p>
                  )}
                  {r.proposed_at && (
                    <p className="mt-2 text-xs text-teal">
                      Proposed:{" "}
                      {new Date(r.proposed_at).toLocaleString("en-US", {
                        weekday: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {r.delay_minutes != null
                        ? r.delay_minutes === 0
                          ? " · Instant"
                          : ` · +${r.delay_minutes} min`
                        : ""}
                    </p>
                  )}
                  {r.session_id && (
                    <a
                      href={`/portal/session/${r.session_id}`}
                      className="mt-1 inline-block text-xs text-teal hover:underline"
                    >
                      Open linked session room →
                    </a>
                  )}
                </div>
                {canPropose && (
                  <Button
                    type="button"
                    size="sm"
                    variant={isOpen ? "outline" : "gold"}
                    onClick={() => {
                      setExpandedId(isOpen ? null : r.id);
                      setError(null);
                      setSuccess(null);
                    }}
                  >
                    {isOpen ? "Cancel" : "Accept & propose"}
                  </Button>
                )}
              </div>

              {isOpen && canPropose && (
                <div className="mt-4 border-t border-border pt-4 space-y-4">
                  <p className="text-sm text-ink-soft">
                    Choose when you can meet. The client will receive Accept /
                    Decline email links.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DELAYS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setDelay(d.value)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors",
                          delay === d.value
                            ? "border-gold bg-gold/15 text-forest font-medium"
                            : "border-border text-ink-soft hover:border-forest/30"
                        )}
                      >
                        {d.value === 0 ? (
                          <Zap className="h-3.5 w-3.5" />
                        ) : (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label
                      htmlFor={`note-${r.id}`}
                      className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5"
                    >
                      Optional note to client
                    </label>
                    <input
                      id={`note-${r.id}`}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full rounded-full border border-border bg-cream/40 px-4 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
                      placeholder="e.g. I’ll be ready in a quiet space"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="gold"
                    disabled={pending}
                    onClick={() => handlePropose(r.id)}
                  >
                    {pending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      "Send proposal to client"
                    )}
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: {
      label: "Pending",
      className: "bg-gold/15 text-gold-muted border-gold/30",
    },
    proposed: {
      label: "Proposed",
      className: "bg-teal/10 text-teal border-teal/25",
    },
    accepted: {
      label: "Accepted",
      className: "bg-forest/10 text-forest border-forest/20",
    },
    declined: {
      label: "Declined",
      className: "bg-cream-dark text-muted border-border",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-cream-dark text-muted border-border",
    },
    expired: {
      label: "Expired",
      className: "bg-cream-dark text-muted border-border",
    },
  };
  const s = map[status] || {
    label: status,
    className: "bg-cream text-ink border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        s.className
      )}
    >
      {s.label}
    </span>
  );
}
