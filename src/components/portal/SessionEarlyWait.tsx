"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Leaf, Clock, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  JOIN_EARLY_MINUTES,
  formatSessionWhen,
  getSessionTiming,
} from "@/lib/sessions/timing";

interface SessionEarlyWaitProps {
  sessionId: string;
  sessionTitle: string;
  scheduledAt: string;
  durationMinutes: number;
  practitionerName?: string;
}

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

export function SessionEarlyWait({
  sessionId,
  sessionTitle,
  scheduledAt,
  durationMinutes,
  practitionerName = "Michele",
}: SessionEarlyWaitProps) {
  const router = useRouter();
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

  // When the join window opens, go to the live session page
  useEffect(() => {
    if (timing.state === "open" || timing.state === "ended") {
      router.replace(`/portal/session/${sessionId}`);
      router.refresh();
    }
  }, [timing.state, sessionId, router]);

  const ms = Math.max(0, timing.msUntilStart);
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const whenLabel = formatSessionWhen(timing.scheduledStart);

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
        <div className="absolute inset-0 bg-gradient-to-b from-forest-deep/85 via-forest/80 to-forest-deep/90" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center px-5 py-16 sm:py-20 text-center text-cream max-w-2xl mx-auto">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gold/20 text-gold mb-6">
          <Leaf className="h-7 w-7" aria-hidden />
        </span>

        <p className="text-gold-soft text-sm font-medium tracking-[0.18em] uppercase mb-3">
          Sacred pause
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium leading-tight mb-4">
          Your session has not started yet
        </h1>
        <p className="text-cream/85 text-base sm:text-lg leading-relaxed max-w-lg mb-2">
          Take a breath. This time is an invitation to arrive gently—in body,
          in sensation, and in presence with yourself.
        </p>
        <p className="text-cream/70 text-sm mb-10 max-w-md">
          You can enter the room up to {JOIN_EARLY_MINUTES} minutes before the
          scheduled start. Until then, rest here with us.
        </p>

        {/* Session details card */}
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
          <div className="flex items-center gap-2 text-sm text-cream/80 pl-8">
            <Clock className="h-4 w-4 text-teal-light" aria-hidden />
            <span>
              {whenLabel}
              {durationMinutes ? ` · ${durationMinutes} min` : ""}
            </span>
          </div>
        </div>

        {/* Countdown */}
        <p className="text-xs tracking-[0.15em] uppercase text-gold-soft mb-4">
          Begins in
        </p>
        <div
          className="grid grid-cols-4 gap-2 sm:gap-4 w-full max-w-md mb-10"
          aria-live="polite"
          aria-atomic="true"
        >
          <TimeUnit value={days} label="Days" />
          <TimeUnit value={hours} label="Hours" />
          <TimeUnit value={minutes} label="Min" />
          <TimeUnit value={seconds} label="Sec" />
        </div>

        <p className="font-serif text-lg sm:text-xl text-cream/90 italic mb-10 max-w-md leading-relaxed">
          “Healing is not about becoming someone else. It is about remembering
          the sacred intelligence that has always lived within you.”
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button href="/portal" variant="gold" size="lg">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Return to portal
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="border-cream/30 text-cream hover:bg-cream/10 hover:border-cream/50"
            onClick={() => {
              router.refresh();
            }}
          >
            Refresh status
          </Button>
        </div>

        <p className="mt-8 text-xs text-cream/50">
          This page will open your session room automatically when it is time.
        </p>
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-cream/10 border border-cream/15 px-2 py-4 sm:py-5">
      <p className="font-serif text-2xl sm:text-4xl text-gold-soft tabular-nums">
        {pad(value)}
      </p>
      <p className="text-[10px] sm:text-xs uppercase tracking-wider text-cream/60 mt-1">
        {label}
      </p>
    </div>
  );
}
