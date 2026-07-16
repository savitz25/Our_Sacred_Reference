"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { finalizeSessionRecording } from "@/lib/recording/pipeline";

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
