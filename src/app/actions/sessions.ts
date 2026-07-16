"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizeSessionRecording } from "@/lib/recording/pipeline";
import { assertSlotIsBookable } from "@/app/actions/availability";
import { sendSessionRescheduledEmail } from "@/lib/email";
import {
  MIN_BOOKING_LEAD_MINUTES,
  isSlotInBookableFuture,
  wallClockToUtc,
} from "@/lib/availability/slots";

export type RescheduleResult = {
  success: boolean;
  error?: string;
  message?: string;
  sessionId?: string;
  scheduledAt?: string;
  emailSent?: boolean;
};

/**
 * Reschedule an existing upcoming session to a new date/time.
 * Keeps the same session id (recordings + history intact), clears 1h reminder
 * flags so the cron will notify again for the new time, and emails client + Michele.
 */
export async function rescheduleSession(input: {
  sessionId: string;
  date: string;
  time: string;
  timezoneOffsetMinutes?: number;
}): Promise<RescheduleResult> {
  try {
    if (!input.sessionId || !input.date || !input.time) {
      return { success: false, error: "Session, date, and time are required." };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Please sign in to reschedule." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, email, full_name, notifications_enabled")
      .eq("id", user.id)
      .maybeSingle();

    const isPractitioner =
      profile?.role === "practitioner" || profile?.role === "admin";

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", input.sessionId)
      .maybeSingle();

    if (sessionError || !session) {
      return { success: false, error: "Session not found." };
    }

    const isOwner = session.user_id === user.id;
    if (!isOwner && !isPractitioner) {
      return { success: false, error: "Not authorized to reschedule this session." };
    }

    if (session.status === "cancelled" || session.status === "completed") {
      return {
        success: false,
        error: "This session can no longer be rescheduled.",
      };
    }

    const dateIso = input.date.slice(0, 10);
    const offset =
      typeof input.timezoneOffsetMinutes === "number" &&
      !Number.isNaN(input.timezoneOffsetMinutes)
        ? input.timezoneOffsetMinutes
        : null;

    const scheduledAt = wallClockToUtc(dateIso, input.time, offset);
    if (Number.isNaN(scheduledAt.getTime())) {
      return {
        success: false,
        error: "That date or time is invalid. Please pick another slot.",
      };
    }

    if (
      !isSlotInBookableFuture(
        dateIso,
        input.time,
        offset,
        MIN_BOOKING_LEAD_MINUTES
      )
    ) {
      const minsUntil = Math.round(
        (scheduledAt.getTime() - Date.now()) / 60000
      );
      if (minsUntil < 0) {
        return {
          success: false,
          error:
            "That time has already passed. Please choose a later slot or another day.",
        };
      }
      return {
        success: false,
        error: `Please choose a time at least ${MIN_BOOKING_LEAD_MINUTES} minutes from now.`,
      };
    }

    const bookable = await assertSlotIsBookable(
      dateIso,
      input.time,
      offset,
      session.id
    );
    if (!bookable.ok) {
      return { success: false, error: bookable.error };
    }

    // Extra conflict guard excluding this session
    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return {
        success: false,
        error: "Reschedule is temporarily unavailable. Please try again later.",
      };
    }

    const slotStart = scheduledAt.toISOString();
    const previousScheduledAt = new Date(session.scheduled_at);

    // Same slot as current — no-op success
    if (previousScheduledAt.getTime() === scheduledAt.getTime()) {
      return {
        success: true,
        sessionId: session.id,
        scheduledAt: slotStart,
        message: "This session is already at that time.",
        emailSent: false,
      };
    }

    const { data: conflicts } = await admin
      .from("sessions")
      .select("id")
      .eq("scheduled_at", slotStart)
      .neq("status", "cancelled")
      .neq("id", session.id)
      .limit(1);

    if (conflicts && conflicts.length > 0) {
      return {
        success: false,
        error:
          "That time was just booked. Please select another available slot.",
      };
    }

    // Preserve client notes; strip reminder flags; append reschedule audit line
    const notesRaw = session.notes || "";
    const cleanedNotes = notesRaw
      .split("\n")
      .map((l: string) => l.trim())
      .filter(
        (l: string) =>
          l &&
          !l.startsWith("[reminder_1h_sent]") &&
          !l.startsWith("[reminder_sent]")
      )
      .join("\n");
    const auditLine = `[rescheduled ${previousScheduledAt.toISOString()} → ${slotStart}]`;
    const nextNotes = cleanedNotes
      ? `${cleanedNotes}\n${auditLine}`
      : auditLine;

    const nextStatus =
      session.status === "in_progress" ? session.status : "confirmed";

    // Clear 1h reminder so cron re-sends for the new time
    let { error: updateError } = await admin
      .from("sessions")
      .update({
        scheduled_at: slotStart,
        notes: nextNotes,
        status: nextStatus,
        reminder_1h_sent_at: null,
      })
      .eq("id", session.id);

    // Column may not exist yet — retry without it
    if (updateError && /reminder_1h_sent_at|column/i.test(updateError.message)) {
      const retry = await admin
        .from("sessions")
        .update({
          scheduled_at: slotStart,
          notes: nextNotes,
          status: nextStatus,
        })
        .eq("id", session.id);
      updateError = retry.error;
    }

    if (updateError) {
      console.error("[reschedule] update:", updateError);
      return {
        success: false,
        error: updateError.message || "Could not update session time.",
      };
    }

    // Load client profile for email (may differ from actor if practitioner reschedules)
    let clientEmail = profile?.email ?? "";
    let clientName = profile?.full_name || "there";
    if (session.user_id !== user.id) {
      const { data: clientProfile } = await admin
        .from("profiles")
        .select("email, full_name")
        .eq("id", session.user_id)
        .maybeSingle();
      clientEmail = clientProfile?.email || "";
      clientName = clientProfile?.full_name || "there";
    }

    let emailSent = false;
    if (clientEmail) {
      try {
        const emailResult = await sendSessionRescheduledEmail({
          to: clientEmail,
          fullName: clientName,
          sessionTitle: session.title,
          previousScheduledAt,
          scheduledAt,
          durationMinutes: session.duration_minutes ?? 60,
          sessionId: session.id,
        });
        emailSent = emailResult.sent;
        if (!emailResult.sent) {
          console.info("[reschedule] email not sent:", emailResult.reason);
        }
      } catch (e) {
        console.warn("[reschedule] email skipped:", e);
      }
    }

    try {
      revalidatePath("/portal");
      revalidatePath(`/portal/session/${session.id}`);
      revalidatePath(`/portal/session/${session.id}/early`);
      revalidatePath("/admin");
    } catch {
      /* ignore */
    }

    const whenLabel = scheduledAt.toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    return {
      success: true,
      sessionId: session.id,
      scheduledAt: slotStart,
      emailSent,
      message: emailSent
        ? `Session rescheduled to ${whenLabel}. A confirmation email is on its way to you and Michele.`
        : `Session rescheduled to ${whenLabel}. Your session room and library stay the same.`,
    };
  } catch (e) {
    console.error("[reschedule] unhandled:", e);
    return {
      success: false,
      error:
        e instanceof Error
          ? e.message
          : "Something went wrong while rescheduling.",
    };
  }
}

/**
 * End a live session: mark complete, stop LiveKit egress, queue processing.
 */
export async function endSessionAndQueueProcessing(
  sessionId: string
): Promise<{ success: boolean; error?: string; videoId?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return { success: false, error: "Session not found" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isOwner = session.user_id === user.id;
    const isPractitioner =
      profile?.role === "practitioner" || profile?.role === "admin";

    if (!isOwner && !isPractitioner) {
      return { success: false, error: "Not authorized" };
    }

    // Prefer existing processing video for this session to avoid duplicates
    const { data: existingVideo } = await supabase
      .from("videos")
      .select("id")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const result = await finalizeSessionRecording({
      sessionId,
      userId: session.user_id,
      videoId: existingVideo?.id,
    });

    revalidatePath("/portal");
    revalidatePath("/portal/library");
    revalidatePath("/portal/session-complete");

    if (!result.success) {
      return {
        success: false,
        error: result.error ?? "Processing pipeline failed",
        videoId: result.videoId,
      };
    }

    return { success: true, videoId: result.videoId };
  } catch (e) {
    console.error("endSessionAndQueueProcessing", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unexpected error ending session",
    };
  }
}
