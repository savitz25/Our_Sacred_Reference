"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUserForBooking } from "@/app/actions/auth";
import type { SessionType } from "@/lib/database.types";
import { INFORMED_CONSENT_VERSION } from "@/lib/legal";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { assertSlotIsBookable } from "@/app/actions/availability";

export type BookingResult = {
  success: boolean;
  error?: string;
  message?: string;
  sessionId?: string;
  userId?: string;
  emailSent?: boolean;
};

/** Soft timeout so external calls never hang the booking UI forever */
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

function parseLocalSlot(dateIso: string, timeLabel: string): Date {
  // timeLabel like "9:00 AM" or "3:00 PM"
  const parts = timeLabel.trim().split(/\s+/);
  const timePart = parts[0] ?? "9:00";
  const meridiem = (parts[1] ?? "").toUpperCase();
  const [hStr, mStr] = timePart.split(":");
  let hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr ?? "0", 10);
  if (Number.isNaN(hours)) hours = 9;
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  const [y, mo, d] = dateIso.slice(0, 10).split("-").map(Number);
  // Construct as UTC noon-based offset-safe local wall time via Date.UTC then
  // use components — keep simple wall-clock interpretation for scheduling UI
  return new Date(y, mo - 1, d, hours, minutes, 0, 0);
}

function friendlyError(err: unknown): string {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "Something went wrong while booking.";

  const lower = msg.toLowerCase();
  if (lower.includes("missing") && lower.includes("supabase")) {
    return "Booking is temporarily unavailable (server configuration). Please try again later or contact us.";
  }
  if (lower.includes("service_role") || lower.includes("service role")) {
    return "Booking is temporarily unavailable (server configuration). Please try again later.";
  }
  if (lower.includes("timed out")) {
    return "The request took too long. Please try again — if it continues, contact us.";
  }
  if (lower.includes("already") || lower.includes("registered")) {
    return "An account with this email already exists. Use your existing password, or sign in first.";
  }
  if (lower.includes("rate") || lower.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  // Avoid dumping raw stack / internal paths to the client
  if (msg.length > 200 || lower.includes("at ") || lower.includes("\\")) {
    return "We could not complete your booking. Please try again or contact us.";
  }
  return msg;
}

export async function bookDiscoverySession(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  intention?: string;
  consent: boolean;
  informedConsent: boolean;
  date: string;
  time: string;
  sessionType?: SessionType;
}): Promise<BookingResult> {
  try {
    // —— Validation ——
    if (!input.consent) {
      return {
        success: false,
        error: "Communications consent is required to book.",
      };
    }
    if (!input.informedConsent) {
      return {
        success: false,
        error:
          "You must agree to the Informed Consent before confirming your booking.",
      };
    }
    if (!input.firstName?.trim() || !input.lastName?.trim()) {
      return { success: false, error: "Please enter your first and last name." };
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

    if (Number.isNaN(scheduledAt.getTime())) {
      return {
        success: false,
        error: "That date or time is invalid. Please pick another slot.",
      };
    }

    // Allow a 2-minute grace period for clock skew; reject clearly past slots
    const graceMs = 2 * 60 * 1000;
    if (scheduledAt.getTime() < Date.now() - graceMs) {
      return {
        success: false,
        error: "Please choose a future date and time.",
      };
    }

    // Respect practitioner availability blocks + already booked times
    try {
      const bookable = await assertSlotIsBookable(
        input.date.slice(0, 10),
        input.time
      );
      if (!bookable.ok) {
        return { success: false, error: bookable.error };
      }
    } catch (e) {
      console.warn("[booking] assertSlotIsBookable:", e);
      // Continue if availability service fails; conflict check still applies
    }

    // —— 1. Account ——
    let authResult: Awaited<ReturnType<typeof createUserForBooking>>;
    try {
      authResult = await withTimeout(
        createUserForBooking({
          email: input.email,
          password: input.password,
          fullName,
          phone: input.phone,
          intention: input.intention,
        }),
        25_000,
        "Account creation"
      );
    } catch (e) {
      console.error("[booking] createUserForBooking:", e);
      return { success: false, error: friendlyError(e) };
    }

    if (!authResult.success || !authResult.userId) {
      return {
        success: false,
        error: authResult.error
          ? friendlyError(authResult.error)
          : "Could not create or sign in to your account.",
      };
    }

    const userId = authResult.userId;

    // —— 2. Admin client + session ——
    let admin;
    try {
      admin = createAdminClient();
    } catch (e) {
      console.error("[booking] createAdminClient:", e);
      return {
        success: false,
        error:
          "Booking is temporarily unavailable (server configuration). Please try again later.",
      };
    }

    const sessionType = input.sessionType ?? "discovery";
    const duration = sessionType === "discovery" ? 45 : 75;
    const title =
      sessionType === "discovery"
        ? "Free Discovery Session with Michele"
        : "Individual Session with Michele";

    const slotStart = scheduledAt.toISOString();
    const roomName = `sr-${userId.slice(0, 8)}-${Date.now().toString(36)}`;

    // Conflict check (non-fatal if query fails)
    try {
      const { data: conflicts, error: conflictErr } = await admin
        .from("sessions")
        .select("id")
        .eq("scheduled_at", slotStart)
        .neq("status", "cancelled")
        .limit(1);

      if (conflictErr) {
        console.warn("[booking] conflict check:", conflictErr.message);
      } else if (conflicts && conflicts.length > 0) {
        return {
          success: false,
          error:
            "That time was just booked. Please select another available slot.",
        };
      }
    } catch (e) {
      console.warn("[booking] conflict check threw:", e);
    }

    const consentAt = new Date().toISOString();
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
        informed_consent_at: consentAt,
        informed_consent_version: INFORMED_CONSENT_VERSION,
      })
      .select("id")
      .single();

    if (sessionError || !session) {
      console.error("[booking] session insert:", sessionError);
      return {
        success: false,
        error:
          sessionError?.message?.includes("informed_consent")
            ? "Database schema may be missing consent columns. Please run migrations 002–003 in Supabase."
            : friendlyError(
                sessionError?.message ?? "Failed to create session"
              ),
      };
    }

    // Best-effort updates — do not fail booking if these error
    try {
      await admin
        .from("sessions")
        .update({
          meeting_url: `/portal/session/${session.id}`,
          livekit_room: `session-${session.id}`,
        })
        .eq("id", session.id);
    } catch (e) {
      console.warn("[booking] meeting_url update:", e);
    }

    try {
      const { error: consentError } = await admin.from("consents").insert([
        {
          user_id: userId,
          session_id: session.id,
          consent_type: "informed_consent",
          version: INFORMED_CONSENT_VERSION,
          agreed: true,
          agreed_at: consentAt,
          metadata: {
            source: "book-session",
            session_type: sessionType,
          },
        },
        {
          user_id: userId,
          session_id: session.id,
          consent_type: "communications",
          version: INFORMED_CONSENT_VERSION,
          agreed: true,
          agreed_at: consentAt,
          metadata: {
            source: "book-session",
            email: input.email.trim().toLowerCase(),
          },
        },
      ]);
      if (consentError) {
        console.warn("[booking] consent insert:", consentError.message);
      }
    } catch (e) {
      console.warn("[booking] consent insert threw:", e);
    }

    // —— 3. Email (non-blocking for success path; short timeout) ——
    let emailSent = false;
    try {
      const emailResult = await withTimeout(
        sendBookingConfirmationEmail({
          to: input.email.trim().toLowerCase(),
          fullName,
          sessionTitle: title,
          scheduledAt,
          durationMinutes: duration,
          sessionId: session.id,
        }),
        8_000,
        "Confirmation email"
      );
      emailSent = emailResult.sent;
      if (!emailResult.sent) {
        console.info(
          "[booking] confirmation email not sent:",
          emailResult.reason
        );
      }
    } catch (e) {
      console.warn("[booking] email skipped:", e);
    }

    try {
      revalidatePath("/portal");
      revalidatePath("/portal/library");
      revalidatePath("/admin");
    } catch {
      // revalidate can fail outside request context; ignore
    }

    return {
      success: true,
      sessionId: session.id,
      userId,
      emailSent,
      message: authResult.alreadyExisted
        ? emailSent
          ? "Session booked. A confirmation email is on its way."
          : "Session booked. You're signed in — open your portal to join."
        : emailSent
          ? "Account created, session booked, and a confirmation email is on its way."
          : "Account created and session booked. You're signed in.",
    };
  } catch (e) {
    console.error("[booking] unhandled:", e);
    return { success: false, error: friendlyError(e) };
  }
}

/** @deprecated Use getAvailableSlotsForDate from availability actions */
export async function getBookedSlotsForDate(
  dateIso: string
): Promise<string[]> {
  try {
    const { getAvailableSlotsForDate } = await import(
      "@/app/actions/availability"
    );
    const res = await getAvailableSlotsForDate(dateIso);
    return res.booked;
  } catch (e) {
    console.warn("[booking] getBookedSlots threw:", e);
    return [];
  }
}
