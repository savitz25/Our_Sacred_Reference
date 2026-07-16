"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AvailabilityBlock,
  AvailabilityBlockKind,
} from "@/lib/database.types";
import { filterAvailableSlots } from "@/lib/availability/blocks";
import { DEFAULT_BOOKABLE_SLOTS } from "@/lib/availability/slots";

export type AvailabilityActionResult = {
  success: boolean;
  error?: string;
  blocks?: AvailabilityBlock[];
  slots?: string[];
};

async function requirePractitionerId(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "practitioner" && profile?.role !== "admin") {
    return { ok: false, error: "Not authorized" };
  }
  return { ok: true, userId: user.id };
}

export async function listAvailabilityBlocks(
  includeInactive = false
): Promise<AvailabilityActionResult> {
  try {
    const auth = await requirePractitionerId();
    if (!auth.ok) return { success: false, error: auth.error };

    const supabase = await createClient();
    let q = supabase
      .from("availability_blocks")
      .select("*")
      .order("created_at", { ascending: false });

    if (!includeInactive) {
      q = q.eq("is_active", true);
    }

    const { data, error } = await q;
    if (error) {
      console.error("[availability] list:", error.message);
      return { success: false, error: error.message, blocks: [] };
    }
    return { success: true, blocks: data ?? [] };
  } catch (e) {
    console.error("[availability] list threw:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to load blocks",
      blocks: [],
    };
  }
}

export type CreateBlockInput = {
  kind: AvailabilityBlockKind;
  starts_on?: string | null;
  ends_on?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  day_of_week?: number | null;
  recurrence_until?: string | null;
  label?: string | null;
};

export async function createAvailabilityBlock(
  input: CreateBlockInput
): Promise<AvailabilityActionResult> {
  try {
    const auth = await requirePractitionerId();
    if (!auth.ok) return { success: false, error: auth.error };

    if (input.kind === "date_range") {
      if (!input.starts_on) {
        return { success: false, error: "Start date is required." };
      }
      const ends = input.ends_on || input.starts_on;
      if (ends < input.starts_on) {
        return { success: false, error: "End date must be on or after start." };
      }
    }
    if (input.kind === "datetime_range") {
      if (!input.start_at || !input.end_at) {
        return {
          success: false,
          error: "Start and end date/time are required.",
        };
      }
      if (new Date(input.end_at) <= new Date(input.start_at)) {
        return { success: false, error: "End must be after start." };
      }
    }
    if (input.kind === "recurring_weekly") {
      if (
        input.day_of_week == null ||
        input.day_of_week < 0 ||
        input.day_of_week > 6
      ) {
        return { success: false, error: "Please choose a day of the week." };
      }
    }

    const supabase = await createClient();
    const row = {
      kind: input.kind,
      starts_on: input.starts_on ?? null,
      ends_on: input.ends_on ?? input.starts_on ?? null,
      start_time: input.start_time || null,
      end_time: input.end_time || null,
      start_at: input.start_at ?? null,
      end_at: input.end_at ?? null,
      day_of_week: input.day_of_week ?? null,
      recurrence_until: input.recurrence_until ?? null,
      label: input.label?.trim() || null,
      is_active: true,
      created_by: auth.userId,
    };

    const { data, error } = await supabase
      .from("availability_blocks")
      .insert(row)
      .select("*")
      .single();

    if (error) {
      console.error("[availability] create:", error.message);
      return {
        success: false,
        error:
          error.message.includes("availability_blocks") ||
          error.code === "42P01" ||
          error.message.includes("schema cache")
            ? "Availability table missing. Run migration 005_availability_blocks.sql in Supabase."
            : error.message,
      };
    }

    revalidatePath("/admin");
    revalidatePath("/book-session");
    return { success: true, blocks: data ? [data] : [] };
  } catch (e) {
    console.error("[availability] create threw:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create block",
    };
  }
}

export async function deactivateAvailabilityBlock(
  id: string
): Promise<AvailabilityActionResult> {
  try {
    const auth = await requirePractitionerId();
    if (!auth.ok) return { success: false, error: auth.error };

    const supabase = await createClient();
    const { error } = await supabase
      .from("availability_blocks")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin");
    revalidatePath("/book-session");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to remove block",
    };
  }
}

export async function deleteAvailabilityBlock(
  id: string
): Promise<AvailabilityActionResult> {
  try {
    const auth = await requirePractitionerId();
    if (!auth.ok) return { success: false, error: auth.error };

    const supabase = await createClient();
    const { error } = await supabase
      .from("availability_blocks")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin");
    revalidatePath("/book-session");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete block",
    };
  }
}

/**
 * Public: available slots for a calendar day (default − booked − blocked).
 * Pass client timezoneOffsetMinutes (from Date#getTimezoneOffset) for correct same-day filtering.
 * Optional excludeSessionId frees that session’s current slot (reschedule flow).
 */
export async function getAvailableSlotsForDate(
  dateIso: string,
  timezoneOffsetMinutes?: number | null,
  excludeSessionId?: string | null
): Promise<{ slots: string[]; booked: string[]; error?: string }> {
  const day = dateIso.slice(0, 10);
  const offset =
    timezoneOffsetMinutes == null || Number.isNaN(timezoneOffsetMinutes)
      ? null
      : timezoneOffsetMinutes;

  try {
    const admin = createAdminClient();
    // Query sessions for this calendar day using a wide UTC window so
    // timezone differences don't drop same-day bookings
    const [y, mo, d] = day.split("-").map(Number);
    const windowStart = new Date(Date.UTC(y, mo - 1, d - 1, 0, 0, 0));
    const windowEnd = new Date(Date.UTC(y, mo - 1, d + 1, 23, 59, 59));

    const { data: sessions } = await admin
      .from("sessions")
      .select("id, scheduled_at")
      .gte("scheduled_at", windowStart.toISOString())
      .lte("scheduled_at", windowEnd.toISOString())
      .neq("status", "cancelled");

    const otherSessions = (sessions ?? []).filter(
      (row) => !excludeSessionId || row.id !== excludeSessionId
    );

    // Map booked times back to wall-clock labels in the client's zone
    const booked = otherSessions
      .map((row) => {
        const dt = new Date(row.scheduled_at);
        // Convert UTC instant to client wall clock for label matching
        if (offset != null) {
          const localMs = dt.getTime() - offset * 60 * 1000;
          const local = new Date(localMs);
          // Use UTC getters on the shifted value = client local components
          const ly = local.getUTCFullYear();
          const lm = local.getUTCMonth() + 1;
          const ld = local.getUTCDate();
          const iso = `${ly}-${String(lm).padStart(2, "0")}-${String(ld).padStart(2, "0")}`;
          if (iso !== day) return null;
          const h = local.getUTCHours();
          const mi = local.getUTCMinutes();
          const mer = h >= 12 ? "PM" : "AM";
          const h12 = h % 12 === 0 ? 12 : h % 12;
          return `${h12}:${String(mi).padStart(2, "0")} ${mer}`;
        }
        // Fallback server-local
        const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
        if (iso !== day) return null;
        return dt.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      })
      .filter((x): x is string => Boolean(x));

    const { data: blocks, error: bErr } = await admin
      .from("availability_blocks")
      .select("*")
      .eq("is_active", true);

    if (bErr) {
      console.warn("[availability] blocks query:", bErr.message);
    }

    const slots = filterAvailableSlots(
      day,
      [...DEFAULT_BOOKABLE_SLOTS],
      blocks ?? [],
      booked,
      offset
    );

    console.info(
      "[availability] day=%s offset=%s exclude=%s available=%j booked=%j",
      day,
      offset,
      excludeSessionId ?? "-",
      slots,
      booked
    );

    return { slots, booked };
  } catch (e) {
    console.error("[availability] getAvailableSlotsForDate:", e);
    return {
      slots: [...DEFAULT_BOOKABLE_SLOTS],
      booked: [],
      error: e instanceof Error ? e.message : "availability error",
    };
  }
}

export async function assertSlotIsBookable(
  dateIso: string,
  timeLabel: string,
  timezoneOffsetMinutes?: number | null,
  excludeSessionId?: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { slots } = await getAvailableSlotsForDate(
    dateIso,
    timezoneOffsetMinutes,
    excludeSessionId
  );
  // Normalize spacing for comparison ("3:00 PM" vs "3:00  PM")
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  const wanted = norm(timeLabel);
  if (!slots.some((s) => norm(s) === wanted)) {
    return {
      ok: false,
      error:
        "That time is no longer available (it may be booked, blocked, or too soon). Please choose another slot — same-day times need at least 30 minutes notice.",
    };
  }
  return { ok: true };
}
