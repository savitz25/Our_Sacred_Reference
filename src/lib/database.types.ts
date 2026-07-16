export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "client" | "practitioner" | "admin";
export type SessionStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";
export type SessionType =
  | "discovery"
  | "individual"
  | "ongoing"
  | "other";
export type VideoStatus =
  | "processing"
  | "ready"
  | "failed"
  | "archived";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: UserRole;
          timezone: string | null;
          notifications_enabled: boolean;
          recording_consent: boolean;
          intention: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          timezone?: string | null;
          notifications_enabled?: boolean;
          recording_consent?: boolean;
          intention?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          timezone?: string | null;
          notifications_enabled?: boolean;
          recording_consent?: boolean;
          intention?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          therapist_id: string | null;
          title: string;
          session_type: SessionType;
          scheduled_at: string;
          duration_minutes: number;
          status: SessionStatus;
          meeting_url: string | null;
          livekit_room: string | null;
          notes: string | null;
          recording_enabled: boolean;
          informed_consent_at: string | null;
          informed_consent_version: string | null;
          egress_id: string | null;
          recording_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          therapist_id?: string | null;
          title?: string;
          session_type?: SessionType;
          scheduled_at: string;
          duration_minutes?: number;
          status?: SessionStatus;
          meeting_url?: string | null;
          livekit_room?: string | null;
          notes?: string | null;
          recording_enabled?: boolean;
          informed_consent_at?: string | null;
          informed_consent_version?: string | null;
          egress_id?: string | null;
          recording_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          therapist_id?: string | null;
          title?: string;
          session_type?: SessionType;
          scheduled_at?: string;
          duration_minutes?: number;
          status?: SessionStatus;
          meeting_url?: string | null;
          livekit_room?: string | null;
          notes?: string | null;
          recording_enabled?: boolean;
          informed_consent_at?: string | null;
          informed_consent_version?: string | null;
          egress_id?: string | null;
          recording_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      consents: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          consent_type: string;
          version: string;
          agreed: boolean;
          agreed_at: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id?: string | null;
          consent_type: string;
          version?: string;
          agreed?: boolean;
          agreed_at?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string | null;
          consent_type?: string;
          version?: string;
          agreed?: boolean;
          agreed_at?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      videos: {
        Row: {
          id: string;
          session_id: string | null;
          user_id: string;
          title: string;
          category_tags: string[];
          storage_path: string | null;
          public_url: string | null;
          duration_seconds: number | null;
          transcript_summary: string | null;
          status: VideoStatus;
          thumbnail_path: string | null;
          egress_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          user_id: string;
          title: string;
          category_tags?: string[];
          storage_path?: string | null;
          public_url?: string | null;
          duration_seconds?: number | null;
          transcript_summary?: string | null;
          status?: VideoStatus;
          thumbnail_path?: string | null;
          egress_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          user_id?: string;
          title?: string;
          category_tags?: string[];
          storage_path?: string | null;
          public_url?: string | null;
          duration_seconds?: number | null;
          transcript_summary?: string | null;
          status?: VideoStatus;
          thumbnail_path?: string | null;
          egress_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      availability_slots: {
        Row: {
          id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_practitioner: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      session_status: SessionStatus;
      session_type: SessionType;
      video_status: VideoStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type Video = Database["public"]["Tables"]["videos"]["Row"];
