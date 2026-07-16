"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Video,
  Leaf,
  Clock,
  Sparkles,
  Shield,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { VideoRoom } from "@/components/portal/VideoRoom";
import { SessionEarlyWait } from "@/components/portal/SessionEarlyWait";
import {
  JOIN_EARLY_MINUTES,
  formatSessionWhen,
  getSessionTiming,
  type SessionTimingState,
} from "@/lib/sessions/timing";

interface SessionLobbyProps {
  sessionId: string;
  sessionTitle: string;
  scheduledAt: string;
  durationMinutes: number;
  isPractitioner: boolean;
  practitionerName?: string;
  /** Server-side timing state at render time */
  initialTimingState: SessionTimingState;
}

/**
 * Pre-session lobby with a prominent Start Session CTA.
 * Early clicks route to the serene countdown wait page;
 * open window (or practitioner prep) enters the LiveKit room.
 */
export function SessionLobby({
  sessionId,
  sessionTitle,
  scheduledAt,
  durationMinutes,
  isPractitioner,
  practitionerName = "Michele",
  initialTimingState,
}: SessionLobbyProps) {
  const router = useRouter();
  // Always land on the lobby so Start Session is prominent.
  // Early clicks route into the countdown wait UI.
  const [phase, setPhase] = useState<"lobby" | "waiting" | "room">("lobby");
  const [starting, setStarting] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const timing = useMemo(
    () =>
      getSessionTiming({
        scheduledAt,
        durationMinutes,
        now,
      }),
    [scheduledAt, durationMinutes, now]
  );

  const canEnterRoom =
    isPractitioner || timing.state === "open";

  const handleStartSession = useCallback(() => {
    setStarting(true);
    const current = getSessionTiming({
      scheduledAt,
      durationMinutes,
    });

    // Clicked too early as client → serene countdown (never force into room)
    if (current.state === "early" && !isPractitioner) {
      setPhase("waiting");
      setStarting(false);
      // Keep URL bookmarkable for wait state
      router.replace(`/portal/session/${sessionId}/early`);
      return;
    }

    if (current.state === "ended" && !isPractitioner) {
      router.replace(`/portal/session/${sessionId}`);
      router.refresh();
      setStarting(false);
      return;
    }

    setPhase("room");
    setStarting(false);
  }, [scheduledAt, durationMinutes, isPractitioner, sessionId, router]);

  if (phase === "waiting") {
    return (
      <SessionEarlyWait
        sessionId={sessionId}
        sessionTitle={sessionTitle}
        scheduledAt={scheduledAt}
        durationMinutes={durationMinutes}
        practitionerName={practitionerName}
      />
    );
  }

  if (phase === "room") {
    return (
      <VideoRoom
        sessionId={sessionId}
        sessionTitle={sessionTitle}
        isPractitioner={isPractitioner}
      />
    );
  }

  const whenLabel = formatSessionWhen(timing.scheduledStart);
  const msUntilOpen = Math.max(0, timing.msUntilOpen);
  const minutesUntilOpen = Math.ceil(msUntilOpen / 60000);

  return (
    <div className="relative min-h-[calc(100vh-8rem)] rounded-3xl overflow-hidden border border-border shadow-elevated">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=80"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-deep/88 via-forest/82 to-forest-deep/92" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center px-5 py-16 sm:py-20 text-center text-cream max-w-2xl mx-auto">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gold/20 text-gold mb-6">
          <Leaf className="h-7 w-7" aria-hidden />
        </span>

        <p className="text-gold-soft text-sm font-medium tracking-[0.18em] uppercase mb-3">
          Sacred space
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium leading-tight mb-4">
          Ready when you are
        </h1>
        <p className="text-cream/85 text-base sm:text-lg leading-relaxed max-w-lg mb-8">
          Arrive gently. When you begin, you&apos;ll enter an encrypted video
          room with camera, microphone, and serene session controls.
        </p>

        <div className="w-full rounded-2xl border border-cream/15 bg-cream/10 backdrop-blur-sm px-6 py-5 mb-10 text-left">
          <div className="flex items-start gap-3 mb-3">
            <Sparkles className="h-5 w-5 text-gold-soft shrink-0 mt-0.5" />
            <div>
              <p className="font-serif text-xl text-cream">{sessionTitle}</p>
              <p className="text-sm text-cream/70 mt-1">
                with {practitionerName}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-cream/80 pl-8">
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-light" aria-hidden />
              {whenLabel}
              {durationMinutes ? ` · ${durationMinutes} min` : ""}
            </span>
            <span className="inline-flex items-center gap-2">
              <Shield className="h-4 w-4 text-teal-light" aria-hidden />
              Encrypted · private
            </span>
          </div>
          {timing.state === "early" && isPractitioner && (
            <p className="mt-3 pl-8 text-xs text-gold-soft">
              Practitioner prep — you may enter before the client join window
              (opens {JOIN_EARLY_MINUTES} min before start
              {minutesUntilOpen > 0
                ? ` · ~${minutesUntilOpen} min until clients can join`
                : ""}
              ).
            </p>
          )}
          {timing.state === "early" && !isPractitioner && (
            <p className="mt-3 pl-8 text-xs text-gold-soft">
              Join opens {JOIN_EARLY_MINUTES} minutes before start
              {minutesUntilOpen > 0
                ? ` · about ${minutesUntilOpen} min from now`
                : ""}
              . Starting early opens a quiet waiting space.
            </p>
          )}
          {(timing.state === "open" || initialTimingState === "open") &&
            timing.state !== "early" && (
              <p className="mt-3 pl-8 text-xs text-teal-light">
                The room is open. You may start your session now.
              </p>
            )}
        </div>

        <button
          type="button"
          onClick={handleStartSession}
          disabled={starting}
          className="group relative w-full max-w-md overflow-hidden rounded-full bg-gold-shimmer px-8 py-5 text-forest-deep shadow-elevated transition-all duration-300 hover:brightness-105 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-soft focus-visible:ring-offset-2 focus-visible:ring-offset-forest-deep disabled:opacity-70 disabled:pointer-events-none"
          aria-label="Start Session"
        >
          <span className="relative z-10 flex items-center justify-center gap-3 font-serif text-xl sm:text-2xl font-medium">
            {starting ? (
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            ) : (
              <Video className="h-6 w-6" aria-hidden />
            )}
            Start Session
          </span>
        </button>

        {!canEnterRoom && !isPractitioner && (
          <p className="mt-4 text-sm text-cream/60 max-w-sm">
            If you start before the join window, you&apos;ll be guided to a
            quiet waiting space with a countdown.
          </p>
        )}

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Button
            href="/portal"
            variant="outline"
            size="md"
            className="border-cream/30 text-cream hover:bg-cream/10 hover:border-cream/50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Return to portal
          </Button>
        </div>

        <p className="mt-8 text-xs text-cream/45 max-w-sm leading-relaxed">
          Camera and microphone permissions are requested only after you start.
          You can adjust devices, blur, and backgrounds in-session.
        </p>
      </div>
    </div>
  );
}
