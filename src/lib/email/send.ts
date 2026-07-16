import { Resend } from "resend";
import {
  appointmentRecipients,
  getFromAddress,
  getPractitionerNotifyEmail,
  getResendApiKey,
  getSiteUrl,
  isResendConfigured,
} from "@/lib/email/config";
import {
  bookingConfirmationHtml,
  practitionerSessionReminderHtml,
  practitionerSessionRescheduledHtml,
  recordingReadyHtml,
  sessionReminderHtml,
  sessionRescheduledHtml,
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
 * ~1 hour pre-session reminder.
 * Sends personalized emails to the client and Michele (admin) separately.
 */
export async function sendSessionReminderEmail(input: {
  to: string;
  fullName: string;
  sessionTitle: string;
  scheduledAt: Date;
  durationMinutes: number;
  sessionId: string;
  /** @deprecated prefer minutesUntil */
  hoursUntil?: number;
  minutesUntil?: number;
  notes?: string | null;
  /** When false, skip client email but still notify Michele */
  notifyClient?: boolean;
}): Promise<SendResult> {
  if (!isResendConfigured()) {
    return { sent: false, reason: "RESEND_API_KEY not set" };
  }

  const minutesUntil =
    input.minutesUntil ??
    (input.hoursUntil != null ? Math.round(input.hoursUntil * 60) : 60);

  const whenShort = input.scheduledAt.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const sessionIdTag = input.sessionId.slice(0, 36);
  const recipients: string[] = [];
  const errors: string[] = [];
  let anySent = false;
  let lastId: string | undefined;

  // 1) Client reminder
  if (input.notifyClient !== false) {
    const clientResult = await sendEmail({
      to: input.to,
      subject: `In about 1 hour: ${input.sessionTitle}`,
      html: sessionReminderHtml({
        fullName: input.fullName,
        sessionTitle: input.sessionTitle,
        scheduledAt: input.scheduledAt,
        durationMinutes: input.durationMinutes,
        sessionId: input.sessionId,
        minutesUntil,
        notes: input.notes,
      }),
      tags: [
        { name: "type", value: "session_reminder_1h" },
        { name: "role", value: "client" },
        { name: "session_id", value: sessionIdTag },
      ],
    });
    if (clientResult.sent) {
      anySent = true;
      lastId = clientResult.id;
      recipients.push(...(clientResult.recipients ?? [input.to]));
    } else {
      errors.push(`client: ${clientResult.reason}`);
    }
  }

  // 2) Michele / practitioner reminder (always for appointment ops)
  const practitioner = getPractitionerNotifyEmail().toLowerCase();
  const clientEmail = input.to.trim().toLowerCase();
  if (practitioner && practitioner !== clientEmail) {
    const pracResult = await sendEmail({
      to: practitioner,
      subject: `Session in ~1h: ${input.fullName} — ${whenShort}`,
      html: practitionerSessionReminderHtml({
        clientName: input.fullName || "Client",
        clientEmail: input.to,
        sessionTitle: input.sessionTitle,
        scheduledAt: input.scheduledAt,
        durationMinutes: input.durationMinutes,
        sessionId: input.sessionId,
        minutesUntil,
        notes: input.notes,
      }),
      tags: [
        { name: "type", value: "session_reminder_1h" },
        { name: "role", value: "practitioner" },
        { name: "session_id", value: sessionIdTag },
      ],
    });
    if (pracResult.sent) {
      anySent = true;
      lastId = pracResult.id ?? lastId;
      recipients.push(...(pracResult.recipients ?? [practitioner]));
    } else {
      errors.push(`practitioner: ${pracResult.reason}`);
    }
  }

  if (anySent) {
    return { sent: true, id: lastId, recipients: [...new Set(recipients)] };
  }

  return {
    sent: false,
    reason: errors.join("; ") || "no recipients",
  };
}

/**
 * Reschedule confirmation — personalized emails to client and Michele.
 */
export async function sendSessionRescheduledEmail(input: {
  to: string;
  fullName: string;
  sessionTitle: string;
  previousScheduledAt: Date;
  scheduledAt: Date;
  durationMinutes: number;
  sessionId: string;
}): Promise<SendResult> {
  if (!isResendConfigured()) {
    return { sent: false, reason: "RESEND_API_KEY not set" };
  }

  const whenShort = input.scheduledAt.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const sessionIdTag = input.sessionId.slice(0, 36);
  const recipients: string[] = [];
  const errors: string[] = [];
  let anySent = false;
  let lastId: string | undefined;

  const clientResult = await sendEmail({
    to: input.to,
    subject: `Rescheduled: ${input.sessionTitle} — ${whenShort}`,
    html: sessionRescheduledHtml(input),
    tags: [
      { name: "type", value: "session_rescheduled" },
      { name: "role", value: "client" },
      { name: "session_id", value: sessionIdTag },
    ],
  });
  if (clientResult.sent) {
    anySent = true;
    lastId = clientResult.id;
    recipients.push(...(clientResult.recipients ?? [input.to]));
  } else {
    errors.push(`client: ${clientResult.reason}`);
  }

  const practitioner = getPractitionerNotifyEmail().toLowerCase();
  const clientEmail = input.to.trim().toLowerCase();
  if (practitioner && practitioner !== clientEmail) {
    const pracResult = await sendEmail({
      to: practitioner,
      subject: `Rescheduled: ${input.fullName} — ${whenShort}`,
      html: practitionerSessionRescheduledHtml({
        clientName: input.fullName || "Client",
        clientEmail: input.to,
        sessionTitle: input.sessionTitle,
        previousScheduledAt: input.previousScheduledAt,
        scheduledAt: input.scheduledAt,
        durationMinutes: input.durationMinutes,
        sessionId: input.sessionId,
      }),
      tags: [
        { name: "type", value: "session_rescheduled" },
        { name: "role", value: "practitioner" },
        { name: "session_id", value: sessionIdTag },
      ],
    });
    if (pracResult.sent) {
      anySent = true;
      lastId = pracResult.id ?? lastId;
      recipients.push(...(pracResult.recipients ?? [practitioner]));
    } else {
      errors.push(`practitioner: ${pracResult.reason}`);
    }
  }

  if (anySent) {
    return { sent: true, id: lastId, recipients: [...new Set(recipients)] };
  }
  return { sent: false, reason: errors.join("; ") || "no recipients" };
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
