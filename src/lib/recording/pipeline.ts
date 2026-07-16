import { createAdminClient } from "@/lib/supabase/admin";
import {
  extractEgressFilePath,
  getEgressInfo,
  startRoomRecording,
  stopRoomRecording,
} from "@/lib/livekit/egress";
import {
  isLiveKitConfigured,
  isSupabaseS3Configured,
  recordingStoragePath,
} from "@/lib/livekit/config";
import { processRecordingWithFfmpeg } from "@/lib/media/ffmpeg-process";
import { sendRecordingReadyEmail } from "@/lib/media/notify";
import { EgressStatus } from "livekit-server-sdk";

export type PipelineResult = {
  success: boolean;
  mode: "livekit" | "demo";
  steps: string[];
  videoId?: string;
  storagePath?: string;
  error?: string;
};

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

/**
 * Ensure a videos row exists in `processing` for this session.
 */
export async function ensureVideoRow(input: {
  sessionId: string;
  userId: string;
  title: string;
  sessionType: string;
  videoId?: string;
}): Promise<string> {
  const admin = createAdminClient();

  if (input.videoId) return input.videoId;

  const { data: existing } = await admin
    .from("videos")
    .select("id")
    .eq("session_id", input.sessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: video, error } = await admin
    .from("videos")
    .insert({
      session_id: input.sessionId,
      user_id: input.userId,
      title: input.title || "Session recording",
      category_tags: tagsForType(input.sessionType),
      status: "processing",
      transcript_summary:
        "Recording in progress. Your video will appear when LiveKit Egress completes.",
    })
    .select("id")
    .single();

  if (error || !video) {
    throw new Error(error?.message || "Failed to create video row");
  }
  return video.id;
}

/**
 * Start RoomCompositeEgress for a live session.
 */
export async function beginSessionRecording(input: {
  sessionId: string;
  roomName: string;
  userId: string;
}): Promise<{ egressId: string; filepath: string } | { demo: true; reason: string }> {
  if (!isLiveKitConfigured()) {
    return { demo: true, reason: "LiveKit not configured" };
  }

  const admin = createAdminClient();
  const { data: session } = await admin
    .from("sessions")
    .select("*")
    .eq("id", input.sessionId)
    .single();

  if (!session) throw new Error("Session not found");

  // Avoid duplicate active egress
  if (session.egress_id) {
    return {
      egressId: session.egress_id,
      filepath:
        session.recording_path ||
        recordingStoragePath(input.userId, input.sessionId),
    };
  }

  const started = await startRoomRecording({
    roomName: input.roomName || session.livekit_room || `session-${input.sessionId}`,
    userId: input.userId,
    sessionId: input.sessionId,
  });

  await admin
    .from("sessions")
    .update({
      egress_id: started.egressId,
      recording_path: started.filepath,
      status: "in_progress",
    })
    .eq("id", input.sessionId);

  const videoId = await ensureVideoRow({
    sessionId: input.sessionId,
    userId: input.userId,
    title: session.title,
    sessionType: session.session_type,
  });

  await admin
    .from("videos")
    .update({
      status: "processing",
      egress_id: started.egressId,
      storage_path: started.filepath,
      transcript_summary: "LiveKit RoomCompositeEgress recording…",
    })
    .eq("id", videoId);

  return { egressId: started.egressId, filepath: started.filepath };
}

/**
 * Stop egress (if any) and finalize pipeline when possible.
 */
export async function finalizeSessionRecording(input: {
  sessionId: string;
  userId: string;
  videoId?: string;
}): Promise<PipelineResult> {
  const steps: string[] = [];
  const admin = createAdminClient();

  const { data: session } = await admin
    .from("sessions")
    .select("*")
    .eq("id", input.sessionId)
    .single();

  if (!session) {
    return { success: false, mode: "demo", steps, error: "Session not found" };
  }

  await admin
    .from("sessions")
    .update({ status: "completed" })
    .eq("id", input.sessionId);
  steps.push("session_completed");

  const videoId = await ensureVideoRow({
    sessionId: input.sessionId,
    userId: session.user_id,
    title: session.title,
    sessionType: session.session_type,
    videoId: input.videoId,
  });
  steps.push("video_row_ready");

  if (!isLiveKitConfigured()) {
    // Demo fallback — mark ready with placeholder path (no real media)
    const storagePath = recordingStoragePath(session.user_id, input.sessionId);
    await admin
      .from("videos")
      .update({
        status: "ready",
        storage_path: storagePath,
        category_tags: tagsForType(session.session_type),
        transcript_summary:
          "Demo mode: set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, NEXT_PUBLIC_LIVEKIT_URL and Supabase S3 keys for real recordings.",
      })
      .eq("id", videoId);
    steps.push("demo_ready");
    return {
      success: true,
      mode: "demo",
      steps,
      videoId,
      storagePath,
    };
  }

  // Stop active egress
  const egressId = session.egress_id;
  if (egressId) {
    try {
      await stopRoomRecording(egressId);
      steps.push("egress_stopped");
    } catch (e) {
      console.warn("stopEgress", e);
      steps.push("egress_stop_skipped");
    }
  } else {
    // Late-start: try to record remaining? Not possible after empty room.
    // Create a stub note that recording was not started.
    steps.push("no_egress_id");
  }

  // Poll briefly for completion (webhook is primary path)
  let storagePath =
    session.recording_path ||
    recordingStoragePath(session.user_id, input.sessionId);

  if (egressId) {
    for (let i = 0; i < 5; i++) {
      await sleep(1500);
      try {
        const info = await getEgressInfo(egressId);
        if (!info) break;
        const status = info.status;
        if (
          status === EgressStatus.EGRESS_COMPLETE ||
          status === EgressStatus.EGRESS_ENDING
        ) {
          const filePath = extractEgressFilePath(info);
          if (filePath) {
            storagePath = normalizeStoragePath(filePath, session.user_id, input.sessionId);
          }
          if (status === EgressStatus.EGRESS_COMPLETE) {
            steps.push("egress_complete_polled");
            break;
          }
        }
        if (
          status === EgressStatus.EGRESS_FAILED ||
          status === EgressStatus.EGRESS_ABORTED ||
          status === EgressStatus.EGRESS_LIMIT_REACHED
        ) {
          await admin
            .from("videos")
            .update({
              status: "failed",
              transcript_summary: `Egress failed with status ${status}`,
            })
            .eq("id", videoId);
          return {
            success: false,
            mode: "livekit",
            steps: [...steps, "egress_failed"],
            videoId,
            error: `Egress status ${status}`,
          };
        }
      } catch {
        break;
      }
    }
  }

  // If S3 is configured, file should already be in Supabase Storage
  // Run optional FFmpeg when available
  let finalPath = storagePath;
  let durationSeconds: number | undefined;
  let processMsg = "Awaiting LiveKit egress webhook for final file.";

  if (isSupabaseS3Configured()) {
    const ff = await processRecordingWithFfmpeg(storagePath);
    finalPath = ff.path;
    durationSeconds = ff.durationSeconds;
    processMsg = ff.message;
    steps.push(ff.processed ? "ffmpeg_processed" : "ffmpeg_skipped");
  } else {
    steps.push("s3_not_configured_await_webhook");
  }

  // If we know egress completed and S3 is set, mark ready now; else stay processing for webhook
  const markReady = steps.includes("egress_complete_polled") && isSupabaseS3Configured();

  await admin
    .from("videos")
    .update({
      status: markReady ? "ready" : "processing",
      storage_path: finalPath,
      category_tags: tagsForType(session.session_type),
      duration_seconds: durationSeconds ?? null,
      transcript_summary: processMsg,
      egress_id: egressId,
    })
    .eq("id", videoId);

  if (markReady) {
    steps.push("video_ready");
    await sendRecordingReadyEmail(session.user_id, session.title);
    steps.push("email_attempted");
  } else {
    steps.push("awaiting_egress_webhook");
  }

  return {
    success: true,
    mode: "livekit",
    steps,
    videoId,
    storagePath: finalPath,
  };
}

/**
 * Called from LiveKit webhook when egress ends successfully.
 */
export async function onEgressCompleted(input: {
  egressId: string;
  filePath?: string | null;
  durationSeconds?: number | null;
}): Promise<PipelineResult> {
  const steps: string[] = ["webhook_received"];
  const admin = createAdminClient();

  const { data: session } = await admin
    .from("sessions")
    .select("*")
    .eq("egress_id", input.egressId)
    .maybeSingle();

  const { data: videoByEgress } = await admin
    .from("videos")
    .select("*")
    .eq("egress_id", input.egressId)
    .maybeSingle();

  let video = videoByEgress;
  const userId = session?.user_id;
  const sessionId = session?.id;

  if (!video && session) {
    const { data: v } = await admin
      .from("videos")
      .select("*")
      .eq("session_id", session.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    video = v;
  }

  if (!video || !userId || !sessionId) {
    return {
      success: false,
      mode: "livekit",
      steps,
      error: "No matching video/session for egress",
    };
  }

  let storagePath =
    input.filePath ||
    video.storage_path ||
    recordingStoragePath(userId, sessionId);

  storagePath = normalizeStoragePath(storagePath, userId, sessionId);

  const ff = await processRecordingWithFfmpeg(storagePath);
  steps.push(ff.processed ? "ffmpeg_processed" : "ffmpeg_skipped");

  await admin
    .from("videos")
    .update({
      status: "ready",
      storage_path: ff.path,
      duration_seconds: ff.durationSeconds ?? input.durationSeconds ?? null,
      category_tags: tagsForType(session?.session_type ?? "individual"),
      transcript_summary: `Recording ready. ${ff.message}`,
    })
    .eq("id", video.id);

  steps.push("video_ready");

  await sendRecordingReadyEmail(userId, video.title);
  steps.push("email_attempted");

  return {
    success: true,
    mode: "livekit",
    steps,
    videoId: video.id,
    storagePath: ff.path,
  };
}

function normalizeStoragePath(
  filePath: string,
  userId: string,
  sessionId: string
): string {
  // Strip s3://bucket/ prefix if present
  const p = filePath.replace(/^s3:\/\/[^/]+\//, "");
  // Prefer standard path if filePath is absolute/odd
  if (p.startsWith("http") || !p.includes(userId)) {
    if (p.startsWith("http")) {
      return recordingStoragePath(userId, sessionId);
    }
  }
  return p.replace(/^\//, "");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
