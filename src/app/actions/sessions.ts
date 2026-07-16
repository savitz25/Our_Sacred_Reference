"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function endSessionAndQueueProcessing(
  sessionId: string
): Promise<{ success: boolean; error?: string; videoId?: string }> {
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

  // Client or practitioner can end
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

  await supabase
    .from("sessions")
    .update({ status: "completed" })
    .eq("id", sessionId);

  // Queue video processing placeholder row
  const admin = createAdminClient();
  const categoryTags = categoryTagsForSessionType(session.session_type);

  const { data: video, error: videoError } = await admin
    .from("videos")
    .insert({
      session_id: sessionId,
      user_id: session.user_id,
      title: session.title || "Session recording",
      category_tags: categoryTags,
      status: "processing",
      storage_path: null,
      transcript_summary:
        "Processing queued. Recording will appear here once the pipeline completes.",
    })
    .select("id")
    .single();

  if (videoError) {
    return { success: false, error: videoError.message };
  }

  // Fire-and-forget webhook to post-session pipeline
  try {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
    await fetch(`${base}/api/webhooks/session-ended`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
      },
      body: JSON.stringify({
        sessionId,
        videoId: video.id,
        userId: session.user_id,
      }),
    });
  } catch {
    // Pipeline will still show processing row; webhook optional in dev
  }

  revalidatePath("/portal");
  revalidatePath("/portal/library");
  revalidatePath("/portal/session-complete");

  return { success: true, videoId: video.id };
}

function categoryTagsForSessionType(type: string): string[] {
  switch (type) {
    case "discovery":
      return ["Felt Sense"];
    case "individual":
      return ["Somatic Healing", "Felt Sense"];
    case "ongoing":
      return ["Mytho-Shamanic Journey", "Embodied Spirituality"];
    default:
      return ["Felt Sense"];
  }
}
