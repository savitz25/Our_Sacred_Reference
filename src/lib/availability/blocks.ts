import type { AvailabilityBlock } from "@/lib/database.types";
import {
  MIN_BOOKING_LEAD_MINUTES,
  SLOT_DURATION_MINUTES,
  isSlotInBookableFuture,
  slotToMinutes,
  timeToMinutes,
  wallClockToUtc,
} from "@/lib/availability/slots";

/**
 * Returns true if the given bookable slot is covered by any active block.
 * Uses client timezone offset so wall-clock times match the booking UI.
 */
export function isSlotBlocked(
  dateIso: string,
  timeLabel: string,
  blocks: AvailabilityBlock[],
  timezoneOffsetMinutes?: number | null
): boolean {
  const slotStart = wallClockToUtc(
    dateIso,
    timeLabel,
    timezoneOffsetMinutes
  );
  const slotEnd = new Date(
    slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000
  );
  const slotMin = slotToMinutes(timeLabel);
  const slotEndMin = slotMin + SLOT_DURATION_MINUTES;
  // Day-of-week in the client's wall calendar (from dateIso components)
  const [y, mo, d] = dateIso.slice(0, 10).split("-").map(Number);
  const day = new Date(y, mo - 1, d).getDay();

  for (const b of blocks) {
    if (!b.is_active) continue;

    if (b.kind === "datetime_range" && b.start_at && b.end_at) {
      const bs = new Date(b.start_at).getTime();
      const be = new Date(b.end_at).getTime();
      if (slotStart.getTime() < be && slotEnd.getTime() > bs) return true;
      continue;
    }

    if (b.kind === "date_range" && b.starts_on) {
      const starts = b.starts_on.slice(0, 10);
      const ends = (b.ends_on ?? b.starts_on).slice(0, 10);
      if (dateIso < starts || dateIso > ends) continue;
      if (!b.start_time || !b.end_time) return true;
      const bStart = timeToMinutes(b.start_time);
      const bEnd = timeToMinutes(b.end_time);
      if (slotMin < bEnd && slotEndMin > bStart) return true;
      continue;
    }

    if (b.kind === "recurring_weekly" && b.day_of_week != null) {
      if (day !== b.day_of_week) continue;
      if (b.recurrence_until && dateIso > b.recurrence_until.slice(0, 10)) {
        continue;
      }
      if (b.starts_on && dateIso < b.starts_on.slice(0, 10)) continue;
      if (!b.start_time || !b.end_time) return true;
      const bStart = timeToMinutes(b.start_time);
      const bEnd = timeToMinutes(b.end_time);
      if (slotMin < bEnd && slotEndMin > bStart) return true;
    }
  }

  return false;
}

export function filterAvailableSlots(
  dateIso: string,
  candidateSlots: string[],
  blocks: AvailabilityBlock[],
  bookedLabels: string[],
  timezoneOffsetMinutes?: number | null
): string[] {
  const bookedNorm = new Set(
    bookedLabels.map((b) => b.replace(/\s+/g, " ").trim())
  );
  const day = dateIso.slice(0, 10);

  return candidateSlots.filter((slot) => {
    if (bookedNorm.has(slot)) return false;
    if (isSlotBlocked(day, slot, blocks, timezoneOffsetMinutes)) return false;
    // Same-day: require MIN_BOOKING_LEAD_MINUTES from now (timezone-aware)
    if (
      !isSlotInBookableFuture(
        day,
        slot,
        timezoneOffsetMinutes,
        MIN_BOOKING_LEAD_MINUTES
      )
    ) {
      return false;
    }
    return true;
  });
}

export { wallClockToUtc };
