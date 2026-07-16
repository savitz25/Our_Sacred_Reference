import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSessionReminderEmail } from "@/lib/email";

/**
 * Optional session reminder cron.
 *
 * Protect with CRON_SECRET:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Example (Vercel Cron or external scheduler, every hour):
 *   GET/POST /api/cron/session-reminders
 *
 * Sends a reminder for sessions starting in the next ~24 hours
 * that have not already been reminded (metadata flag on notes or future column).
 */
export async function POST(request: Request) {
  return runReminders(request);
}

export async function GET(request: Request) {
  return runReminders(request);
}

async function runReminders(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    // Require secret in production
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 }
    );
  }

  try {
    const admin = createAdminClient();
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: sessions, error } = await admin
      .from("sessions")
      .select("id, user_id, title, scheduled_at, duration_minutes, status, notes")
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", windowEnd.toISOString())
      .neq("status", "cancelled")
      .neq("status", "completed");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const results: { sessionId: string; sent: boolean; reason?: string }[] = [];

    for (const session of sessions ?? []) {
      // Skip if already reminded (simple flag in notes)
      if (session.notes?.includes("[reminder_sent]")) {
        results.push({
          sessionId: session.id,
          sent: false,
          reason: "already_reminded",
        });
        continue;
      }

      const { data: profile } = await admin
        .from("profiles")
        .select("email, full_name, notifications_enabled")
        .eq("id", session.user_id)
        .single();

      if (!profile?.email || profile.notifications_enabled === false) {
        results.push({
          sessionId: session.id,
          sent: false,
          reason: "no_email_or_opted_out",
        });
        continue;
      }

      const scheduledAt = new Date(session.scheduled_at);
      const hoursUntil = Math.max(
        1,
        Math.round((scheduledAt.getTime() - now.getTime()) / (60 * 60 * 1000))
      );

      const result = await sendSessionReminderEmail({
        to: profile.email,
        fullName: profile.full_name || "there",
        sessionTitle: session.title,
        scheduledAt,
        durationMinutes: session.duration_minutes,
        sessionId: session.id,
        hoursUntil,
      });

      if (result.sent) {
        await admin
          .from("sessions")
          .update({
            notes: `${session.notes || ""}\n[reminder_sent]`.trim(),
          })
          .eq("id", session.id);
      }

      results.push({
        sessionId: session.id,
        sent: result.sent,
        reason: result.sent ? undefined : result.reason,
      });
    }

    return NextResponse.json({
      ok: true,
      checked: sessions?.length ?? 0,
      results,
    });
  } catch (e) {
    console.error("session-reminders", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Cron failed" },
      { status: 500 }
    );
  }
}
