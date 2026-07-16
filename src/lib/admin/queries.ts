import { createClient } from "@/lib/supabase/server";
import type { SessionStatus, SessionType, VideoStatus } from "@/lib/database.types";

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

type ProfileEmbed = {
  full_name: string | null;
  email: string;
} | null;

/**
 * All appointments for practitioners (RLS allows is_practitioner()).
 */
export async function fetchAdminSessions(): Promise<AdminSessionRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sessions")
    .select(
      `
      id,
      user_id,
      title,
      session_type,
      scheduled_at,
      duration_minutes,
      status,
      meeting_url,
      notes,
      profiles!sessions_user_id_fkey (
        full_name,
        email
      )
    `
    )
    .order("scheduled_at", { ascending: false });

  if (error) {
    // Fallback without named FK if schema name differs
    console.warn("[admin] sessions join fallback", error.message);
    const { data: sessions } = await supabase
      .from("sessions")
      .select("*")
      .order("scheduled_at", { ascending: false });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email");

    const map = new Map(
      (profiles ?? []).map((p) => [p.id, p] as const)
    );

    return (sessions ?? []).map((s) => {
      const p = map.get(s.user_id);
      return {
        id: s.id,
        user_id: s.user_id,
        title: s.title,
        session_type: s.session_type,
        scheduled_at: s.scheduled_at,
        duration_minutes: s.duration_minutes,
        status: s.status,
        meeting_url: s.meeting_url,
        notes: s.notes,
        client_name: p?.full_name ?? null,
        client_email: p?.email ?? null,
      };
    });
  }

  return (data ?? []).map((row) => {
    const raw = row as typeof row & {
      profiles?: ProfileEmbed | ProfileEmbed[];
    };
    const profile = Array.isArray(raw.profiles)
      ? raw.profiles[0]
      : raw.profiles;
    return {
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      session_type: row.session_type,
      scheduled_at: row.scheduled_at,
      duration_minutes: row.duration_minutes,
      status: row.status,
      meeting_url: row.meeting_url,
      notes: row.notes,
      client_name: profile?.full_name ?? null,
      client_email: profile?.email ?? null,
    };
  });
}

/**
 * All video consults / recordings for practitioners.
 */
export async function fetchAdminVideos(): Promise<AdminVideoRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("videos")
    .select(
      `
      id,
      session_id,
      user_id,
      title,
      category_tags,
      status,
      storage_path,
      duration_seconds,
      created_at,
      transcript_summary,
      profiles!videos_user_id_fkey (
        full_name,
        email
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[admin] videos join fallback", error.message);
    const { data: videos } = await supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email");

    const map = new Map(
      (profiles ?? []).map((p) => [p.id, p] as const)
    );

    return (videos ?? []).map((v) => {
      const p = map.get(v.user_id);
      return {
        id: v.id,
        session_id: v.session_id,
        user_id: v.user_id,
        title: v.title,
        category_tags: v.category_tags ?? [],
        status: v.status,
        storage_path: v.storage_path,
        duration_seconds: v.duration_seconds,
        created_at: v.created_at,
        transcript_summary: v.transcript_summary,
        client_name: p?.full_name ?? null,
        client_email: p?.email ?? null,
      };
    });
  }

  return (data ?? []).map((row) => {
    const raw = row as typeof row & {
      profiles?: ProfileEmbed | ProfileEmbed[];
    };
    const profile = Array.isArray(raw.profiles)
      ? raw.profiles[0]
      : raw.profiles;
    return {
      id: row.id,
      session_id: row.session_id,
      user_id: row.user_id,
      title: row.title,
      category_tags: row.category_tags ?? [],
      status: row.status,
      storage_path: row.storage_path,
      duration_seconds: row.duration_seconds,
      created_at: row.created_at,
      transcript_summary: row.transcript_summary,
      client_name: profile?.full_name ?? null,
      client_email: profile?.email ?? null,
    };
  });
}
