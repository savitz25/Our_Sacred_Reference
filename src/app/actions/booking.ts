"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUserForBooking } from "@/app/actions/auth";
import type { SessionType } from "@/lib/database.types";

export type BookingResult = {
  success: boolean;
  error?: string;
  message?: string;
  sessionId?: string;
  userId?: string;
};

function parseLocalSlot(dateIso: string, timeLabel: string): Date {
  // timeLabel like "9:00 AM" or "3:00 PM"
  const [timePart, meridiem] = timeLabel.trim().split(/\s+/);
  const [hStr, mStr] = timePart.split(":");
  let hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr ?? "0", 10);
  const mer = (meridiem ?? "").toUpperCase();
  if (mer === "PM" && hours < 12) hours += 12;
  if (mer === "AM" && hours === 12) hours = 0;

  // Use local components from dateIso (YYYY-MM-DD)
  const [y, mo, d] = dateIso.slice(0, 10).split("-").map(Number);
  return new Date(y, mo - 1, d, hours, minutes, 0, 0);
}

export async function bookDiscoverySession(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  intention?: string;
  consent: boolean;
  /** ISO date string YYYY-MM-DD */
  date: string;
  /** e.g. "3:00 PM" */
  time: string;
  sessionType?: SessionType;
}): Promise<BookingResult> {
  if (!input.consent) {
    return { success: false, error: "Consent is required to book." };
  }
  if (!input.email || !input.password || input.password.length < 8) {
    return {
      success: false,
      error: "Valid email and password (8+ characters) are required.",
    };
  }
  if (!input.date || !input.time) {
    return { success: false, error: "Please select a date and time." };
  }

  const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();
  const scheduledAt = parseLocalSlot(input.date, input.time);

  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt < new Date()) {
    return {
      success: false,
      error: "Please choose a future date and time.",
    };
  }

  // 1. Create / sign-in user
  const authResult = await createUserForBooking({
    email: input.email,
    password: input.password,
    fullName,
    phone: input.phone,
    intention: input.intention,
  });

  if (!authResult.success || !authResult.userId) {
    return {
      success: false,
      error: authResult.error ?? "Could not create account",
    };
  }

  const userId = authResult.userId;
  const admin = createAdminClient();
  const sessionType = input.sessionType ?? "discovery";
  const duration = sessionType === "discovery" ? 45 : 75;
  const title =
    sessionType === "discovery"
      ? "Free Discovery Session with Michele"
      : "Individual Session with Michele";

  const roomName = `sr-${userId.slice(0, 8)}-${Date.now().toString(36)}`;

  // 2. Conflict check (same user or overlapping therapist slot — simple: exact slot taken)
  const slotStart = scheduledAt.toISOString();
  const { data: conflicts } = await admin
    .from("sessions")
    .select("id")
    .eq("scheduled_at", slotStart)
    .neq("status", "cancelled")
    .limit(1);

  if (conflicts && conflicts.length > 0) {
    return {
      success: false,
      error:
        "That time was just booked. Please select another available slot.",
    };
  }

  // 3. Create session record
  const { data: session, error: sessionError } = await admin
    .from("sessions")
    .insert({
      user_id: userId,
      title,
      session_type: sessionType,
      scheduled_at: slotStart,
      duration_minutes: duration,
      status: "confirmed",
      livekit_room: roomName,
      meeting_url: `/portal/session/${roomName}`,
      notes: input.intention ?? null,
      recording_enabled: true,
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    return {
      success: false,
      error: sessionError?.message ?? "Failed to create session",
    };
  }

  // Update meeting_url with real session id
  await admin
    .from("sessions")
    .update({
      meeting_url: `/portal/session/${session.id}`,
      livekit_room: `session-${session.id}`,
    })
    .eq("id", session.id);

  revalidatePath("/portal");
  revalidatePath("/portal/library");

  return {
    success: true,
    sessionId: session.id,
    userId,
    message:
      authResult.alreadyExisted
        ? "Session booked. You're signed in — open your portal to join."
        : "Account created, session booked, and you're signed in.",
  };
}

/** Fetch taken slots for a calendar day (public-safe via admin for booking UI) */
export async function getBookedSlotsForDate(
  dateIso: string
): Promise<string[]> {
  try {
    const admin = createAdminClient();
    const [y, mo, d] = dateIso.slice(0, 10).split("-").map(Number);
    const start = new Date(y, mo - 1, d, 0, 0, 0);
    const end = new Date(y, mo - 1, d, 23, 59, 59);

    const { data } = await admin
      .from("sessions")
      .select("scheduled_at")
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", end.toISOString())
      .neq("status", "cancelled");

    if (!data) return [];

    return data.map((row) => {
      const dt = new Date(row.scheduled_at);
      return dt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    });
  } catch {
    return [];
  }
}
