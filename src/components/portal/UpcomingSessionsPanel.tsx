"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  RescheduleSessionModal,
  type RescheduleSessionInfo,
} from "@/components/portal/RescheduleSessionModal";

export type UpcomingSessionRow = {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
};

interface UpcomingSessionsPanelProps {
  sessions: UpcomingSessionRow[];
  /** Highlight card for next joinable session (within 24h) */
  nextSessionId?: string | null;
}

export function UpcomingSessionsPanel({
  sessions,
  nextSessionId,
}: UpcomingSessionsPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rescheduleTarget, setRescheduleTarget] =
    useState<RescheduleSessionInfo | null>(null);
  const [banner, setBanner] = useState<string | null>(() => {
    if (searchParams.get("rescheduled") === "1") {
      return (
        searchParams.get("msg") ||
        "Your session has been rescheduled. A confirmation email was sent to you and Michele."
      );
    }
    return null;
  });

  const nextSession = useMemo(
    () => sessions.find((s) => s.id === nextSessionId) ?? sessions[0] ?? null,
    [sessions, nextSessionId]
  );

  const joinable =
    nextSession &&
    new Date(nextSession.scheduled_at).getTime() - Date.now() <
      24 * 60 * 60 * 1000;

  function openReschedule(s: UpcomingSessionRow) {
    setRescheduleTarget({
      id: s.id,
      title: s.title,
      scheduled_at: s.scheduled_at,
      duration_minutes: s.duration_minutes,
    });
  }

  function dismissBanner() {
    setBanner(null);
    // Clean query without full reload noise
    if (searchParams.get("rescheduled")) {
      router.replace("/portal", { scroll: false });
    }
  }

  return (
    <>
      {banner && (
        <div
          className="mb-8 flex items-start gap-3 rounded-2xl border border-teal/30 bg-teal/10 px-4 py-4 sm:px-5"
          role="status"
        >
          <CheckCircle2 className="h-5 w-5 text-teal shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-forest">Session rescheduled</p>
            <p className="text-sm text-ink-soft mt-0.5 leading-relaxed">
              {banner}
            </p>
          </div>
          <button
            type="button"
            onClick={dismissBanner}
            className="rounded-full p-1 text-muted hover:bg-teal/15 hover:text-forest"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {nextSession && joinable && (
        <Card className="mb-8 bg-sacred-gradient border-0 text-cream !shadow-elevated">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <Badge className="mb-3 !bg-gold/20 !text-gold-soft">
                Upcoming
              </Badge>
              <h2 className="font-serif text-2xl mb-1">{nextSession.title}</h2>
              <p className="text-cream/75 text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" aria-hidden />
                {new Date(nextSession.scheduled_at).toLocaleString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                · {nextSession.duration_minutes} min
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="border-cream/35 text-cream hover:bg-cream/10 hover:border-cream/50"
                onClick={() => openReschedule(nextSession)}
              >
                <CalendarClock className="h-5 w-5" aria-hidden />
                Reschedule
              </Button>
              <Button
                href={`/portal/session/${nextSession.id}`}
                variant="gold"
                size="lg"
              >
                <Video className="h-5 w-5" aria-hidden />
                Start Session
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="lg:col-span-2">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl text-forest flex items-center gap-2">
            <Calendar className="h-5 w-5 text-teal" aria-hidden />
            Upcoming sessions
          </h2>
        </div>
        {!sessions.length ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
            <p className="text-ink-soft mb-4">No upcoming sessions yet.</p>
            <Button href="/book-session" variant="gold" size="sm">
              Book free discovery session
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {sessions.map((s) => {
              const canJoin =
                new Date(s.scheduled_at).getTime() - Date.now() <
                24 * 60 * 60 * 1000;
              return (
                <li
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-cream/50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-ink">{s.title}</p>
                    <p className="text-sm text-muted">
                      {new Date(s.scheduled_at).toLocaleString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}{" "}
                      · {s.duration_minutes} min · {s.status}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openReschedule(s)}
                    >
                      <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                      Reschedule
                    </Button>
                    {canJoin ? (
                      <Button
                        href={`/portal/session/${s.id}`}
                        size="sm"
                        variant="secondary"
                      >
                        Start Session
                      </Button>
                    ) : (
                      <Badge variant="outline">Scheduled</Badge>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <RescheduleSessionModal
        session={rescheduleTarget}
        open={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        onSuccess={(msg) => {
          setBanner(msg);
        }}
      />
    </>
  );
}
