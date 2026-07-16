"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { getBookedSlotsForDate } from "@/app/actions/booking";
import { cn } from "@/lib/utils";

interface CalendarPlaceholderProps {
  onSelectSlot?: (date: Date, time: string) => void;
  selectedDate?: Date | null;
  selectedTime?: string | null;
}

const DEFAULT_SLOTS = [
  "9:00 AM",
  "11:00 AM",
  "1:00 PM",
  "3:00 PM",
  "5:00 PM",
];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDateIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function CalendarPlaceholder({
  onSelectSlot,
  selectedDate,
  selectedTime,
}: CalendarPlaceholderProps) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(today));
  const [localDate, setLocalDate] = useState<Date | null>(selectedDate ?? null);
  const [localTime, setLocalTime] = useState<string | null>(
    selectedTime ?? null
  );
  const [booked, setBooked] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const activeDate = selectedDate ?? localDate;
  const activeTime = selectedTime ?? localTime;

  const firstDow = startOfMonth(viewMonth).getDay();
  const totalDays = daysInMonth(viewMonth);
  const monthLabel = viewMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    if (!activeDate) {
      setBooked([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    getBookedSlotsForDate(toDateIso(activeDate))
      .then((slots) => {
        if (!cancelled) setBooked(slots);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeDate]);

  const availableSlots = DEFAULT_SLOTS.filter((s) => {
    // Normalize comparison for booked times
    const bookedNorm = booked.map((b) => b.replace(/\s+/g, " ").trim());
    return !bookedNorm.includes(s);
  });

  function selectDate(day: number) {
    const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    if (d < today) return;
    if (d.getDay() === 0 || d.getDay() === 6) return;
    setLocalDate(d);
    setLocalTime(null);
  }

  function selectTime(time: string) {
    if (!activeDate) return;
    setLocalTime(time);
    onSelectSlot?.(activeDate, time);
  }

  function prevMonth() {
    setViewMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1)
    );
  }

  function nextMonth() {
    setViewMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-soft">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-serif text-xl text-forest">{monthLabel}</h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-forest/5 text-forest"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-forest/5 text-forest"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        className="grid grid-cols-7 gap-1 text-center text-xs text-muted mb-2"
        role="row"
      >
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 font-medium">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Calendar">
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const d = new Date(
            viewMonth.getFullYear(),
            viewMonth.getMonth(),
            day
          );
          const isPast = d < today;
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          const disabled = isPast || isWeekend;
          const selected = activeDate ? sameDay(d, activeDate) : false;
          const isToday = sameDay(d, today);

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => selectDate(day)}
              aria-pressed={selected}
              aria-label={d.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
              className={cn(
                "aspect-square rounded-xl text-sm transition-colors",
                disabled && "text-muted/40 cursor-not-allowed",
                !disabled && !selected && "hover:bg-teal/10 text-ink",
                selected && "bg-forest text-cream font-medium",
                isToday && !selected && "ring-1 ring-teal/40"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <div className="flex items-center gap-2 text-sm text-ink-soft mb-3">
          <Clock className="h-4 w-4 text-teal" aria-hidden />
          <span>
            {activeDate
              ? `Available times — ${activeDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}`
              : "Select a weekday to see available times"}
          </span>
        </div>
        {loadingSlots && (
          <p className="text-sm text-muted mb-2">Checking availability…</p>
        )}
        {activeDate && !loadingSlots && availableSlots.length === 0 && (
          <p className="text-sm text-muted">No availability on this day.</p>
        )}
        {availableSlots.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {availableSlots.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => selectTime(time)}
                aria-pressed={activeTime === time}
                className={cn(
                  "rounded-full px-4 py-2 text-sm border transition-colors",
                  activeTime === time
                    ? "bg-teal text-white border-teal"
                    : "border-border text-ink hover:border-teal/40 hover:bg-teal/5"
                )}
              >
                {time}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="mt-4 text-xs text-muted">
        Live availability from Supabase. Booked slots are hidden automatically.
        Optional Cal.com embed can replace this UI later.
      </p>
    </div>
  );
}
