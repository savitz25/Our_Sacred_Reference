/** Session join window helpers */

/** How many minutes before scheduled start clients may enter the room */
export const JOIN_EARLY_MINUTES = 15;

/** How many minutes after scheduled end clients may still join */
export const JOIN_LATE_GRACE_MINUTES = 30;

export type SessionTimingState = "early" | "open" | "ended";

export function getSessionTiming(input: {
  scheduledAt: string | Date;
  durationMinutes: number;
  now?: Date;
}): {
  state: SessionTimingState;
  scheduledStart: Date;
  scheduledEnd: Date;
  openAt: Date;
  closeAt: Date;
  msUntilStart: number;
  msUntilOpen: number;
} {
  const now = input.now ?? new Date();
  const scheduledStart = new Date(input.scheduledAt);
  const duration = Math.max(15, input.durationMinutes || 60);
  const scheduledEnd = new Date(
    scheduledStart.getTime() + duration * 60 * 1000
  );
  const openAt = new Date(
    scheduledStart.getTime() - JOIN_EARLY_MINUTES * 60 * 1000
  );
  const closeAt = new Date(
    scheduledEnd.getTime() + JOIN_LATE_GRACE_MINUTES * 60 * 1000
  );

  const t = now.getTime();
  let state: SessionTimingState = "open";
  if (t < openAt.getTime()) state = "early";
  else if (t > closeAt.getTime()) state = "ended";

  return {
    state,
    scheduledStart,
    scheduledEnd,
    openAt,
    closeAt,
    msUntilStart: scheduledStart.getTime() - t,
    msUntilOpen: openAt.getTime() - t,
  };
}

export function formatSessionWhen(d: Date): string {
  return d.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
