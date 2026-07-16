import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Post-session automation pipeline (MVP).
 * Triggered when a session ends. Marks video processing steps,
 * optionally notifies via Resend, and leaves hooks for FFmpeg/LiveKit egress.
 */
export async function POST(request: Request) {
  const auth = request.headers.get("Authorization");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey || auth !== `Bearer ${serviceKey}`) {
    // Allow internal calls without key in local dev only
    if (process.env.NODE_ENV === "production" && auth !== `Bearer ${serviceKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const { sessionId, videoId, userId } = body as {
      sessionId?: string;
      videoId?: string;
      userId?: string;
    };

    if (!sessionId || !videoId || !userId) {
      return NextResponse.json(
        { error: "sessionId, videoId, userId required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Mark session completed
    await admin
      .from("sessions")
      .update({ status: "completed" })
      .eq("id", sessionId);

    // 2. Simulate pipeline steps (FFmpeg / egress would run here)
    // storage_path pattern: {userId}/{sessionId}/recording.mp4
    const storagePath = `${userId}/${sessionId}/recording.mp4`;

    // 3. In production: pull from LiveKit egress → Supabase Storage
    // For MVP without egress credentials, mark ready with placeholder summary
    const { data: session } = await admin
      .from("sessions")
      .select("title, session_type, notes")
      .eq("id", sessionId)
      .single();

    const tags = tagsForType(session?.session_type ?? "individual");

    await admin
      .from("videos")
      .update({
        status: "ready",
        storage_path: storagePath,
        category_tags: tags,
        transcript_summary:
          session?.notes ||
          "Session recording processed. Connect LiveKit egress + FFmpeg worker for real media files.",
        duration_seconds:
          session?.session_type === "discovery" ? 45 * 60 : 75 * 60,
      })
      .eq("id", videoId);

    // 4. Optional Resend notification
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const { data: profile } = await admin
        .from("profiles")
        .select("email, full_name")
        .eq("id", userId)
        .single();

      if (profile?.email) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from:
              process.env.RESEND_FROM_EMAIL ||
              "Sacred Reference <onboarding@resend.dev>",
            to: [profile.email],
            subject: "Your session recording is ready",
            html: `<p>Hello ${profile.full_name || "there"},</p>
              <p>Your session recording has been processed and added to your private library.</p>
              <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}/portal/library">Open library</a></p>
              <p>— Sacred Reference</p>`,
          }),
        });
      }
    }

    return NextResponse.json({
      success: true,
      videoId,
      storagePath,
      steps: [
        "session_completed",
        "ffmpeg_placeholder",
        "metadata_stored",
        resendKey ? "email_sent" : "email_skipped",
      ],
    });
  } catch (e) {
    console.error("session-ended webhook error", e);
    return NextResponse.json({ error: "Pipeline failed" }, { status: 500 });
  }
}

function tagsForType(type: string): string[] {
  switch (type) {
    case "discovery":
      return ["Felt Sense"];
    case "ongoing":
      return ["Mytho-Shamanic Journey", "Embodied Spirituality"];
    default:
      return ["Somatic Healing", "Felt Sense"];
  }
}
