import { Resend } from "resend";
import {
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
  | { sent: true; id?: string }
  | { sent: false; reason: string };

function getClient(): Resend | null {
  const key = getResendApiKey();
  if (!key) return null;
  return new Resend(key);
}

async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  tags?: { name: string; value: string }[];
}): Promise<SendResult> {
  const resend = getClient();
  if (!resend) {
    return { sent: false, reason: "RESEND_API_KEY not set" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [input.to],
      subject: input.subject,
      html: input.html,
      tags: input.tags,
    });

    if (error) {
      console.error("[resend]", error);
      return { sent: false, reason: error.message };
    }

    return { sent: true, id: data?.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Resend request failed";
    console.error("[resend]", msg);
    return { sent: false, reason: msg };
  }
}

/** Booking confirmation — call after successful bookDiscoverySession */
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

  return sendEmail({
    to: input.to,
    subject: `Confirmed: ${input.sessionTitle} — ${when}`,
    html: bookingConfirmationHtml(input),
    tags: [
      { name: "type", value: "booking_confirmation" },
      { name: "session_id", value: input.sessionId.slice(0, 36) },
    ],
  });
}

/** Optional pre-session reminder */
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

  return sendEmail({
    to: input.to,
    subject: `Reminder: ${input.sessionTitle} soon`,
    html: sessionReminderHtml(input),
    tags: [
      { name: "type", value: "session_reminder" },
      { name: "session_id", value: input.sessionId.slice(0, 36) },
    ],
  });
}

/**
 * Recording ready — includes library link + optional time-limited signed URL.
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
    // 48-hour private signed URL for convenience (still requires ownership to re-issue)
    playUrl = await createSignedRecordingUrl(input.storagePath, 60 * 60 * 48);
  }

  // Prefer portal signed-URL API path as durable CTA if storage URL fails
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
