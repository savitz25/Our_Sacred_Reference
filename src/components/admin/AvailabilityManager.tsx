"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarOff,
  Loader2,
  Plus,
  Trash2,
  Ban,
} from "lucide-react";
import type { AvailabilityBlock, AvailabilityBlockKind } from "@/lib/database.types";
import {
  createAvailabilityBlock,
  deactivateAvailabilityBlock,
  deleteAvailabilityBlock,
  listAvailabilityBlocks,
} from "@/app/actions/availability";
import { formatBlockSummary } from "@/lib/availability/slots";
import { DEFAULT_BOOKABLE_SLOTS } from "@/lib/availability/slots";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const WEEKDAYS = [
  { v: 0, label: "Sunday" },
  { v: 1, label: "Monday" },
  { v: 2, label: "Tuesday" },
  { v: 3, label: "Wednesday" },
  { v: 4, label: "Thursday" },
  { v: 5, label: "Friday" },
  { v: 6, label: "Saturday" },
];

type FormKind = "whole_day" | "date_range" | "time_slots" | "weekly";

export function AvailabilityManager() {
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const [formKind, setFormKind] = useState<FormKind>("whole_day");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [recurrenceUntil, setRecurrenceUntil] = useState("");
  const [label, setLabel] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await listAvailabilityBlocks(false);
    if (!res.success) {
      setError(res.error ?? "Could not load blocks");
      setBlocks([]);
    } else {
      setBlocks(res.blocks ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setStartsOn("");
    setEndsOn("");
    setStartTime("09:00");
    setEndTime("17:00");
    setSelectedSlots([]);
    setDayOfWeek(1);
    setRecurrenceUntil("");
    setLabel("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (formKind === "time_slots") {
        if (!startsOn || selectedSlots.length === 0) {
          setError("Pick a date and at least one timeslot to block.");
          setSaving(false);
          return;
        }
        // Create one date_range block per slot (narrow window)
        for (const slot of selectedSlots) {
          const mins = slotTo24(slot);
          const endMins = mins + 60;
          const st = minutesToTime(mins);
          const et = minutesToTime(endMins);
          const res = await createAvailabilityBlock({
            kind: "date_range",
            starts_on: startsOn,
            ends_on: startsOn,
            start_time: st,
            end_time: et,
            label: label || `Blocked ${slot}`,
          });
          if (!res.success) {
            setError(res.error ?? "Failed to create block");
            setSaving(false);
            return;
          }
        }
        setSuccess(`Blocked ${selectedSlots.length} timeslot(s) on ${startsOn}.`);
      } else if (formKind === "whole_day") {
        if (!startsOn) {
          setError("Pick a date to block.");
          setSaving(false);
          return;
        }
        const res = await createAvailabilityBlock({
          kind: "date_range",
          starts_on: startsOn,
          ends_on: startsOn,
          label: label || "Day off",
        });
        if (!res.success) {
          setError(res.error ?? "Failed to create block");
          setSaving(false);
          return;
        }
        setSuccess(`Blocked all day on ${startsOn}.`);
      } else if (formKind === "date_range") {
        if (!startsOn) {
          setError("Start date is required.");
          setSaving(false);
          return;
        }
        const res = await createAvailabilityBlock({
          kind: "date_range",
          starts_on: startsOn,
          ends_on: endsOn || startsOn,
          start_time: startTime || null,
          end_time: endTime || null,
          label: label || "Unavailable",
        });
        if (!res.success) {
          setError(res.error ?? "Failed to create block");
          setSaving(false);
          return;
        }
        setSuccess("Date range blocked.");
      } else {
        // weekly
        const res = await createAvailabilityBlock({
          kind: "recurring_weekly",
          day_of_week: dayOfWeek,
          start_time: startTime || null,
          end_time: endTime || null,
          recurrence_until: recurrenceUntil || null,
          starts_on: startsOn || new Date().toISOString().slice(0, 10),
          label: label || "Weekly block",
        });
        if (!res.success) {
          setError(res.error ?? "Failed to create recurring block");
          setSaving(false);
          return;
        }
        setSuccess("Recurring weekly block saved.");
      }

      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string, hardDelete: boolean) {
    setSaving(true);
    setError(null);
    const res = hardDelete
      ? await deleteAvailabilityBlock(id)
      : await deactivateAvailabilityBlock(id);
    setSaving(false);
    setConfirmId(null);
    if (!res.success) {
      setError(res.error ?? "Could not remove block");
      return;
    }
    setSuccess(hardDelete ? "Block deleted." : "Block deactivated.");
    await load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl text-forest mb-1 flex items-center gap-2">
          <CalendarOff className="h-6 w-6 text-teal" aria-hidden />
          Manage availability
        </h2>
        <p className="text-sm text-ink-soft max-w-2xl">
          Block days, timeslots, or recurring weekly windows. Blocked times are
          hidden from the public booking calendar immediately.
        </p>
      </div>

      {error && (
        <div
          className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="rounded-xl border border-teal/20 bg-teal/5 px-4 py-3 text-sm text-teal-muted"
          role="status"
        >
          {success}
        </div>
      )}

      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-soft space-y-5"
      >
        <p className="text-sm font-medium text-forest">Add a block</p>

        <div className="flex flex-wrap gap-2" role="tablist">
          {(
            [
              ["whole_day", "Whole day"],
              ["date_range", "Date / week range"],
              ["time_slots", "Timeslots"],
              ["weekly", "Weekly recurring"],
            ] as const
          ).map(([k, labelText]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={formKind === k}
              onClick={() => setFormKind(k)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm border transition-colors",
                formKind === k
                  ? "bg-forest text-cream border-forest"
                  : "bg-white text-ink-soft border-border hover:border-teal/40"
              )}
            >
              {labelText}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {(formKind === "whole_day" ||
            formKind === "time_slots" ||
            formKind === "date_range") && (
            <Field label={formKind === "date_range" ? "Start date" : "Date"}>
              <input
                type="date"
                required
                value={startsOn}
                onChange={(e) => setStartsOn(e.target.value)}
                className="input-admin"
              />
            </Field>
          )}

          {formKind === "date_range" && (
            <Field label="End date (inclusive)">
              <input
                type="date"
                value={endsOn}
                onChange={(e) => setEndsOn(e.target.value)}
                className="input-admin"
              />
            </Field>
          )}

          {formKind === "date_range" && (
            <>
              <Field label="Start time (optional — blank = all day)">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input-admin"
                />
              </Field>
              <Field label="End time (optional)">
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input-admin"
                />
              </Field>
            </>
          )}

          {formKind === "weekly" && (
            <>
              <Field label="Day of week">
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="input-admin"
                >
                  {WEEKDAYS.map((d) => (
                    <option key={d.v} value={d.v}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Until date (optional)">
                <input
                  type="date"
                  value={recurrenceUntil}
                  onChange={(e) => setRecurrenceUntil(e.target.value)}
                  className="input-admin"
                />
              </Field>
              <Field label="Start time (blank = all day)">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input-admin"
                />
              </Field>
              <Field label="End time">
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input-admin"
                />
              </Field>
            </>
          )}

          {formKind === "time_slots" && (
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-ink-soft mb-2">
                Timeslots to block
              </p>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_BOOKABLE_SLOTS.map((slot) => {
                  const on = selectedSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() =>
                        setSelectedSlots((prev) =>
                          on
                            ? prev.filter((s) => s !== slot)
                            : [...prev, slot]
                        )
                      }
                      className={cn(
                        "rounded-full px-3 py-1.5 text-sm border transition-colors",
                        on
                          ? "bg-gold/20 border-gold text-forest font-medium"
                          : "border-border text-ink-soft hover:border-teal/40"
                      )}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <Field label="Label (optional)">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Vacation, Retreat, Personal"
              className="input-admin"
            />
          </Field>
        </div>

        <Button type="submit" variant="gold" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add block
            </>
          )}
        </Button>
      </form>

      <div>
        <h3 className="font-serif text-xl text-forest mb-3">Active blocks</h3>
        {loading ? (
          <p className="text-sm text-muted flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        ) : blocks.length === 0 ? (
          <p className="text-sm text-muted rounded-2xl border border-dashed border-border bg-white px-5 py-10 text-center">
            No active blocks. All default weekday slots are open (minus booked
            sessions).
          </p>
        ) : (
          <ul className="space-y-3">
            {blocks.map((b) => (
              <li
                key={b.id}
                className="rounded-2xl border border-border bg-white px-4 py-3 sm:px-5 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant="teal">{kindLabel(b.kind)}</Badge>
                    {b.label && (
                      <span className="text-sm font-medium text-forest">
                        {b.label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ink-soft">
                    {formatBlockSummary(b)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {confirmId === b.id ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmId(null)}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={() => handleRemove(b.id, true)}
                        disabled={saving}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemove(b.id, false)}
                        disabled={saving}
                      >
                        <Ban className="h-3.5 w-3.5" />
                        Deactivate
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmId(b.id)}
                        disabled={saving}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-medium text-ink-soft space-y-1">
      <span>{label}</span>
      {children}
    </label>
  );
}

function kindLabel(k: AvailabilityBlockKind | string) {
  switch (k) {
    case "date_range":
      return "Date range";
    case "datetime_range":
      return "Date & time";
    case "recurring_weekly":
      return "Weekly";
    default:
      return k;
  }
}

function slotTo24(slot: string): number {
  const parts = slot.trim().split(/\s+/);
  const [hStr, mStr] = (parts[0] ?? "9:00").split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr ?? "0", 10) || 0;
  const mer = (parts[1] ?? "").toUpperCase();
  if (mer === "PM" && h < 12) h += 12;
  if (mer === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
