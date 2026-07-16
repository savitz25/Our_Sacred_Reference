import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSessionReminderEmail } from "@/lib/email";
import { isResendConfigured } from "@/lib/email/config";

/**
 * 1-hour session reminder cron.
 *
 * Vercel Cron (vercel.json): every 15 minutes
 *   GET /api/cron/session-reminders
 *
 * Auth: Authorization: Bearer <CRON_SECRET>
 * (Vercel Cron injects this header when CRON_SECRET is set in env.)
 *
 * Selects sessions starting in ~30–75 minutes that have not yet received
 * a 1h reminder, then emails the client and Michele with branded templates.
 */

/** Sessions starting this far out are eligible (lower bound) */
const WINDOW_MIN_MS = 30 * 60 * 1000;
/** Upper bound — 1 hour + 15 min buffer for cron cadence */
const WINDOW_MAX_MS = 75 * 60 * 1000;

const REMINDER_NOTE_FLAG = "[reminder_1h_sent]";
const LEGACY_REMINDER_FLAG = "[reminder_sent]";

export async function POST(request: Request) {
  return runReminders(request);
}

export async function GET(request: Request) {
  return runReminders(request);
}

function authorize(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return null;
  }
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 }
    );
  }
  return null;
}

function alreadyReminded(session: {
  reminder_1h_sent_at?: string | null;
  notes?: string | null;
}): boolean {
  if (session.reminder_1h_sent_at) return true;
  const notes = session.notes || "";
  return (
    notes.includes(REMINDER_NOTE_FLAG) || notes.includes(LEGACY_REMINDER_FLAG)
  );
}

async function markReminded(
  admin: ReturnType<typeof createAdminClient>,
  session: { id: string; notes: string | null }
) {
  const nowIso = new Date().toISOString();
  const notes = session.notes || "";
  const nextNotes = notes.includes(REMINDER_NOTE_FLAG)
    ? notes
    : `${notes}\n${REMINDER_NOTE_FLAG}`.trim();

  // Prefer dedicated column; fall back to notes-only if migration not applied
  const withColumn = await admin
    .from("sessions")
    .update({
      reminder_1h_sent_at: nowIso,
      notes: nextNotes,
    })
    .eq("id", session.id);

  if (withColumn.error) {
    // Column may not exist yet — notes flag still prevents duplicates
    await admin
      .from("sessions")
      .update({ notes: nextNotes })
      .eq("id", session.id);
  }
}

async function runReminders(request: Request) {
  const denied = authorize(request);
  if (denied) return denied;

  const startedAt = Date.now();

  try {
    if (!isResendConfigured()) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "RESEND_API_KEY not set",
        checked: 0,
        sent: 0,
        results: [],
      });
    }

    const admin = createAdminClient();
    const now = new Date();
    const windowStart = new Date(now.getTime() + WINDOW_MIN_MS);
    const windowEnd = new Date(now.getTime() + WINDOW_MAX_MS);

    // Fetch candidates in the 1h window (plus buffer). Filter already-sent in app
    // so we still work if reminder_1h_sent_at column is not migrated yet.
    let { data: sessions, error } = await admin
      .from("sessions")
      .select(
        "id, user_id, title, scheduled_at, duration_minutes, status, notes, reminder_1h_sent_at"
      )
      .gte("scheduled_at", windowStart.toISOString())
      .lte("scheduled_at", windowEnd.toISOString())
      .neq("status", "cancelled")
      .neq("status", "completed")
      .order("scheduled_at", { ascending: true })
      .limit(50);

    // If column missing from schema cache / DB, retry without it
    if (
      error &&
      /reminder_1h_sent_at|column/i.test(error.message || "")
    ) {
      const fallback = await admin
        .from("sessions")
        .select(
          "id, user_id, title, scheduled_at, duration_minutes, status, notes"
        )
        .gte("scheduled_at", windowStart.toISOString())
        .lte("scheduled_at", windowEnd.toISOString())
        .neq("status", "cancelled")
        .neq("status", "completed")
        .order("scheduled_at", { ascending: true })
        .limit(50);
      sessions = (fallback.data ?? []).map((s) => ({
        ...s,
        reminder_1h_sent_at: null as string | null,
      }));
      error = fallback.error;
    }

    if (error) {
      console.error("[cron/session-reminders] query", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const results: {
      sessionId: string;
      sent: boolean;
      reason?: string;
      recipients?: string[];
      minutesUntil?: number;
    }[] = [];

    let sentCount = 0;

    for (const session of sessions ?? []) {
      if (alreadyReminded(session)) {
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
        .maybeSingle();

      if (!profile?.email) {
        results.push({
          sessionId: session.id,
          sent: false,
          reason: "no_client_email",
        });
        continue;
      }

      const scheduledAt = new Date(session.scheduled_at);
      const minutesUntil = Math.max(
        0,
        Math.round((scheduledAt.getTime() - now.getTime()) / 60000)
      );

      const notifyClient = profile.notifications_enabled !== false;

      const result = await sendSessionReminderEmail({
        to: profile.email,
        fullName: profile.full_name || "there",
        sessionTitle: session.title,
        scheduledAt,
        durationMinutes: session.duration_minutes ?? 60,
        sessionId: session.id,
        minutesUntil,
        notes: session.notes,
        notifyClient,
      });

      if (result.sent) {
        await markReminded(admin, {
          id: session.id,
          notes: session.notes,
        });
        sentCount += 1;
        results.push({
          sessionId: session.id,
          sent: true,
          recipients: result.recipients,
          minutesUntil,
          reason: notifyClient
            ? undefined
            : "client_opted_out_practitioner_notified",
        });
      } else {
        results.push({
          sessionId: session.id,
          sent: false,
          reason: result.reason,
          minutesUntil,
        });
      }
    }

    const payload = {
      ok: true,
      window: {
        from: windowStart.toISOString(),
        to: windowEnd.toISOString(),
        description: "sessions starting in 30–75 minutes (~1h reminder)",
      },
      checked: sessions?.length ?? 0,
      sent: sentCount,
      durationMs: Date.now() - startedAt,
      results,
    };

    console.info("[cron/session-reminders]", {
      checked: payload.checked,
      sent: payload.sent,
      durationMs: payload.durationMs,
    });

    return NextResponse.json(payload);
  } catch (e) {
    console.error("[cron/session-reminders]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Cron failed" },
      { status: 500 }
    );
  }
}
