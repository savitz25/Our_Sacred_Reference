import { createClient } from "@/lib/supabase/server";
import type {
  SessionStatus,
  SessionType,
  VideoStatus,
} from "@/lib/database.types";

export type AdminSessionRow = {
  id: string;
  user_id: string;
  title: string;
  session_type: SessionType;
  scheduled_at: string;
  duration_minutes: number;
  status: SessionStatus;
  meeting_url: string | null;
  notes: string | null;
  client_name: string | null;
  client_email: string | null;
  payment_status?: string | null;
  amount_cents?: number | null;
  currency?: string | null;
  charged_at?: string | null;
  payment_error?: string | null;
  stripe_payment_intent_id?: string | null;
};

export type AdminVideoRow = {
  id: string;
  session_id: string | null;
  user_id: string;
  title: string;
  category_tags: string[];
  status: VideoStatus;
  storage_path: string | null;
  duration_seconds: number | null;
  created_at: string;
  transcript_summary: string | null;
  client_name: string | null;
  client_email: string | null;
};

/**
 * Reliable admin fetch: two queries + in-memory join.
 * Avoids brittle FK-name embeds that fail across Supabase projects.
 * RLS must allow practitioners to read all sessions/profiles/videos.
 */
export async function fetchAdminSessions(): Promise<AdminSessionRow[]> {
  try {
    const supabase = await createClient();

    // Prefer payment columns when migration 008 is applied; fall back if missing
    let sessions: Array<Record<string, unknown>> | null = null;
    const withPay = await supabase
      .from("sessions")
      .select(
        "id, user_id, title, session_type, scheduled_at, duration_minutes, status, meeting_url, notes, payment_status, amount_cents, currency, charged_at, payment_error, stripe_payment_intent_id"
      )
      .order("scheduled_at", { ascending: false });

    if (withPay.error) {
      console.warn(
        "[admin] sessions+payment query failed, retrying base fields:",
        withPay.error.message
      );
      const base = await supabase
        .from("sessions")
        .select(
          "id, user_id, title, session_type, scheduled_at, duration_minutes, status, meeting_url, notes"
        )
        .order("scheduled_at", { ascending: false });
      if (base.error) {
        console.error("[admin] sessions query error:", base.error.message, base.error.code);
        return [];
      }
      sessions = (base.data ?? []) as Array<Record<string, unknown>>;
    } else {
      sessions = (withPay.data ?? []) as Array<Record<string, unknown>>;
    }

    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, full_name, email");

    if (pErr) {
      console.error("[admin] profiles query error:", pErr.message, pErr.code);
    }

    const map = new Map((profiles ?? []).map((p) => [p.id, p] as const));

    return (sessions ?? []).map((s) => {
      const p = map.get(s.user_id as string);
      return {
        id: s.id as string,
        user_id: s.user_id as string,
        title: (s.title as string) ?? "Session",
        session_type: s.session_type as SessionType,
        scheduled_at: s.scheduled_at as string,
        duration_minutes: (s.duration_minutes as number) ?? 60,
        status: s.status as SessionStatus,
        meeting_url: (s.meeting_url as string | null) ?? null,
        notes: (s.notes as string | null) ?? null,
        client_name: p?.full_name ?? null,
        client_email: p?.email ?? null,
        payment_status: (s.payment_status as string | null) ?? null,
        amount_cents: (s.amount_cents as number | null) ?? null,
        currency: (s.currency as string | null) ?? null,
        charged_at: (s.charged_at as string | null) ?? null,
        payment_error: (s.payment_error as string | null) ?? null,
        stripe_payment_intent_id:
          (s.stripe_payment_intent_id as string | null) ?? null,
      };
    });
  } catch (e) {
    console.error("[admin] fetchAdminSessions threw:", e);
    return [];
  }
}

export async function fetchAdminVideos(): Promise<AdminVideoRow[]> {
  try {
    const supabase = await createClient();

    const { data: videos, error: vErr } = await supabase
      .from("videos")
      .select(
        "id, session_id, user_id, title, category_tags, status, storage_path, duration_seconds, created_at, transcript_summary"
      )
      .order("created_at", { ascending: false });

    if (vErr) {
      console.error("[admin] videos query error:", vErr.message, vErr.code);
      return [];
    }

    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, full_name, email");

    if (pErr) {
      console.error("[admin] profiles query error:", pErr.message, pErr.code);
    }

    const map = new Map((profiles ?? []).map((p) => [p.id, p] as const));

    return (videos ?? []).map((v) => {
      const p = map.get(v.user_id);
      return {
        id: v.id,
        session_id: v.session_id,
        user_id: v.user_id,
        title: v.title ?? "Recording",
        category_tags: Array.isArray(v.category_tags) ? v.category_tags : [],
        status: v.status,
        storage_path: v.storage_path,
        duration_seconds: v.duration_seconds,
        created_at: v.created_at,
        transcript_summary: v.transcript_summary,
        client_name: p?.full_name ?? null,
        client_email: p?.email ?? null,
      };
    });
  } catch (e) {
    console.error("[admin] fetchAdminVideos threw:", e);
    return [];
  }
}
