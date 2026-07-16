/** Shared default bookable slots and time helpers */

export const DEFAULT_BOOKABLE_SLOTS = [
  "9:00 AM",
  "11:00 AM",
  "1:00 PM",
  "3:00 PM",
  "5:00 PM",
] as const;

export type SlotLabel = (typeof DEFAULT_BOOKABLE_SLOTS)[number] | string;

/** Parse "9:00 AM" → { hours, minutes } */
export function parseSlotLabel(timeLabel: string): {
  hours: number;
  minutes: number;
} {
  const parts = timeLabel.trim().split(/\s+/);
  const timePart = parts[0] ?? "9:00";
  const meridiem = (parts[1] ?? "").toUpperCase();
  const [hStr, mStr] = timePart.split(":");
  let hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr ?? "0", 10) || 0;
  if (Number.isNaN(hours)) hours = 9;
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
}

export function slotToDate(dateIso: string, timeLabel: string): Date {
  const [y, mo, d] = dateIso.slice(0, 10).split("-").map(Number);
  const { hours, minutes } = parseSlotLabel(timeLabel);
  return new Date(y, mo - 1, d, hours, minutes, 0, 0);
}

export function toDateIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "09:00:00" or "09:00" → minutes from midnight */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

export function slotToMinutes(timeLabel: string): number {
  const { hours, minutes } = parseSlotLabel(timeLabel);
  return hours * 60 + minutes;
}

/** Slot duration used when checking overlap (discovery ~45–60 min window) */
export const SLOT_DURATION_MINUTES = 60;

export function formatBlockSummary(block: {
  kind: string;
  starts_on?: string | null;
  ends_on?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  day_of_week?: number | null;
  recurrence_until?: string | null;
  label?: string | null;
}): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (block.kind === "recurring_weekly") {
    const day =
      block.day_of_week != null ? days[block.day_of_week] : "Weekly";
    const hours =
      block.start_time && block.end_time
        ? ` ${block.start_time.slice(0, 5)}–${block.end_time.slice(0, 5)}`
        : " (all day)";
    const until = block.recurrence_until
      ? ` until ${block.recurrence_until}`
      : "";
    return `Every ${day}${hours}${until}`;
  }
  if (block.kind === "datetime_range" && block.start_at && block.end_at) {
    return `${new Date(block.start_at).toLocaleString()} → ${new Date(block.end_at).toLocaleString()}`;
  }
  const start = block.starts_on ?? "?";
  const end = block.ends_on ?? start;
  const range = start === end ? start : `${start} → ${end}`;
  if (block.start_time && block.end_time) {
    return `${range} ${block.start_time.slice(0, 5)}–${block.end_time.slice(0, 5)}`;
  }
  return `${range} (all day)`;
}
