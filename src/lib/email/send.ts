import { Resend } from "resend";
import {
  appointmentRecipients,
  getFromAddress,
  getResendApiKey,
  getSiteUrl,
  isResendConfigured,
} from "@/lib/email/config";
import {
  bookingConfirmationHtml,
  recordingReadyHtml,
  sessionReminderHtml,
} from "@/lib/email/templates";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSignedRecordingUrl } from "@/lib/storage/recordings";

export type SendResult =
  | { sent: true; id?: string; recipients?: string[] }
  | { sent: false; reason: string };

function getClient(): Resend | null {
  const key = getResendApiKey();
  if (!key) return null;
  return new Resend(key);
}

async function sendEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
  tags?: { name: string; value: string }[];
  replyTo?: string;
}): Promise<SendResult> {
  const resend = getClient();
  if (!resend) {
    return { sent: false, reason: "RESEND_API_KEY not set" };
  }

  const to = Array.isArray(input.to)
    ? [...new Set(input.to.map((e) => e.trim().toLowerCase()).filter(Boolean))]
    : [input.to.trim().toLowerCase()];

  if (to.length === 0) {
    return { sent: false, reason: "no recipients" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject: input.subject,
      html: input.html,
      tags: input.tags,
      replyTo: input.replyTo || "michele@oursacredreference.com",
    });

    if (error) {
      console.error("[resend]", error);
      return { sent: false, reason: error.message };
    }

    return { sent: true, id: data?.id, recipients: to };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Resend request failed";
    console.error("[resend]", msg);
    return { sent: false, reason: msg };
  }
}

/**
 * Booking confirmation — customer + Michele (appointment notification).
 */
export async function sendBookingConfirmationEmail(input: {
  to: string;
  fullName: string;
  sessionTitle: string;
  scheduledAt: Date;
  durationMinutes: number;
  sessionId: string;
}): Promise<SendResult> {
  if (!isResendConfigured()) {
    console.info("[email] skip booking confirmation — Resend not configured");
    return { sent: false, reason: "RESEND_API_KEY not set" };
  }

  const when = input.scheduledAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const recipients = appointmentRecipients(input.to);

  return sendEmail({
    to: recipients,
    subject: `Confirmed: ${input.sessionTitle} — ${when}`,
    html: bookingConfirmationHtml(input),
    tags: [
      { name: "type", value: "booking_confirmation" },
      { name: "session_id", value: input.sessionId.slice(0, 36) },
    ],
  });
}

/**
 * Pre-session reminder — customer + Michele (appointment notification).
 */
export async function sendSessionReminderEmail(input: {
  to: string;
  fullName: string;
  sessionTitle: string;
  scheduledAt: Date;
  durationMinutes: number;
  sessionId: string;
  hoursUntil: number;
}): Promise<SendResult> {
  if (!isResendConfigured()) {
    return { sent: false, reason: "RESEND_API_KEY not set" };
  }

  const recipients = appointmentRecipients(input.to);

  return sendEmail({
    to: recipients,
    subject: `Reminder: ${input.sessionTitle} soon`,
    html: sessionReminderHtml(input),
    tags: [
      { name: "type", value: "session_reminder" },
      { name: "session_id", value: input.sessionId.slice(0, 36) },
    ],
  });
}

/**
 * Recording ready — customer only (not an appointment notification).
 * Includes library link + optional time-limited signed URL.
 */
export async function sendRecordingReadyEmail(input: {
  userId: string;
  videoId?: string;
  videoTitle: string;
  storagePath?: string | null;
}): Promise<SendResult> {
  if (!isResendConfigured()) {
    return { sent: false, reason: "RESEND_API_KEY not set" };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", input.userId)
    .single();

  if (!profile?.email) {
    return { sent: false, reason: "no email on profile" };
  }

  const site = getSiteUrl();
  const libraryUrl = input.videoId
    ? `${site}/portal/library?video=${input.videoId}`
    : `${site}/portal/library`;

  let playUrl: string | null = null;
  if (input.storagePath) {
    playUrl = await createSignedRecordingUrl(input.storagePath, 60 * 60 * 48);
  }

  if (!playUrl && input.videoId) {
    playUrl = `${site}/api/videos/${input.videoId}/url`;
  }

  return sendEmail({
    to: profile.email,
    subject: "Your session recording is ready",
    html: recordingReadyHtml({
      fullName: profile.full_name || "there",
      videoTitle: input.videoTitle,
      libraryUrl,
      playUrl,
    }),
    tags: [
      { name: "type", value: "recording_ready" },
      ...(input.videoId
        ? [{ name: "video_id", value: input.videoId.slice(0, 36) }]
        : []),
    ],
  });
}

/** Load profile email for a user id */
export async function getProfileEmail(
  userId: string
): Promise<{ email: string; full_name: string | null } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .maybeSingle();
  if (!data?.email) return null;
  return data;
}
