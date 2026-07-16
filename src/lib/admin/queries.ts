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

    const { data: sessions, error: sErr } = await supabase
      .from("sessions")
      .select(
        "id, user_id, title, session_type, scheduled_at, duration_minutes, status, meeting_url, notes"
      )
      .order("scheduled_at", { ascending: false });

    if (sErr) {
      console.error("[admin] sessions query error:", sErr.message, sErr.code);
      return [];
    }

    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, full_name, email");

    if (pErr) {
      console.error("[admin] profiles query error:", pErr.message, pErr.code);
    }

    const map = new Map((profiles ?? []).map((p) => [p.id, p] as const));

    return (sessions ?? []).map((s) => {
      const p = map.get(s.user_id);
      return {
        id: s.id,
        user_id: s.user_id,
        title: s.title ?? "Session",
        session_type: s.session_type,
        scheduled_at: s.scheduled_at,
        duration_minutes: s.duration_minutes ?? 60,
        status: s.status,
        meeting_url: s.meeting_url,
        notes: s.notes,
        client_name: p?.full_name ?? null,
        client_email: p?.email ?? null,
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
