import type { AvailabilityBlock } from "@/lib/database.types";
import {
  SLOT_DURATION_MINUTES,
  slotToDate,
  slotToMinutes,
  timeToMinutes,
  toDateIso,
} from "@/lib/availability/slots";

/**
 * Returns true if the given bookable slot is covered by any active block.
 */
export function isSlotBlocked(
  dateIso: string,
  timeLabel: string,
  blocks: AvailabilityBlock[]
): boolean {
  const slotStart = slotToDate(dateIso, timeLabel);
  const slotEnd = new Date(
    slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000
  );
  const slotMin = slotToMinutes(timeLabel);
  const slotEndMin = slotMin + SLOT_DURATION_MINUTES;
  const day = slotStart.getDay();

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
      if (!b.start_time || !b.end_time) return true; // whole day(s)
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
      // Only apply from created_at day forward (optional)
      if (b.starts_on && dateIso < b.starts_on.slice(0, 10)) continue;
      if (!b.start_time || !b.end_time) return true;
      const bStart = timeToMinutes(b.start_time);
      const bEnd = timeToMinutes(b.end_time);
      if (slotMin < bEnd && slotEndMin > bStart) return true;
    }
  }

  return false;
}

/** True if every default slot on that date is blocked (whole day unavailable). */
export function isDayFullyBlocked(
  dateIso: string,
  blocks: AvailabilityBlock[],
  defaultSlots: string[]
): boolean {
  if (defaultSlots.length === 0) return false;
  return defaultSlots.every((slot) => isSlotBlocked(dateIso, slot, blocks));
}

export function filterAvailableSlots(
  dateIso: string,
  candidateSlots: string[],
  blocks: AvailabilityBlock[],
  bookedLabels: string[]
): string[] {
  const bookedNorm = new Set(
    bookedLabels.map((b) => b.replace(/\s+/g, " ").trim())
  );
  return candidateSlots.filter((slot) => {
    if (bookedNorm.has(slot)) return false;
    if (isSlotBlocked(dateIso, slot, blocks)) return false;
    // Hide past slots for today
    const when = slotToDate(dateIso, slot);
    if (when.getTime() < Date.now() - 2 * 60 * 1000) return false;
    return true;
  });
}

export { toDateIso };
