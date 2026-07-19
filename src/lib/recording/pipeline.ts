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
import { sendRecordingReadyEmail } from "@/lib/email";
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

  const roomName =
    input.roomName || session.livekit_room || `session-${input.sessionId}`;

  const started = await startRoomRecording({
    roomName,
    userId: input.userId,
    sessionId: input.sessionId,
  });

  console.info("[beginSessionRecording]", {
    sessionId: input.sessionId,
    roomName,
    egressId: started.egressId,
    filepath: started.filepath,
  });

  await admin
    .from("sessions")
    .update({
      egress_id: started.egressId,
      recording_path: started.filepath,
      livekit_room: roomName,
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

  // Poll for completion (webhook is primary path; this is a best-effort backup)
  let storagePath =
    session.recording_path ||
    recordingStoragePath(session.user_id, input.sessionId);

  let egressComplete = false;
  if (egressId) {
    for (let i = 0; i < 12; i++) {
      await sleep(2000);
      try {
        const info = await getEgressInfo(egressId);
        if (!info) continue;
        const status = info.status as number;
        if (
          status === EgressStatus.EGRESS_COMPLETE ||
          status === EgressStatus.EGRESS_ENDING
        ) {
          const filePath = extractEgressFilePath(info);
          if (filePath) {
            storagePath = normalizeStoragePath(
              filePath,
              session.user_id,
              input.sessionId
            );
          }
          if (status === EgressStatus.EGRESS_COMPLETE) {
            steps.push("egress_complete_polled");
            egressComplete = true;
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
              egress_id: egressId,
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
      } catch (e) {
        console.warn("[finalize] poll error", e);
      }
    }
  }

  // Look for uploaded object even if poll timed out (S3 may already have it)
  if (isSupabaseS3Configured()) {
    const found = await findRecordingInFolder(
      session.user_id,
      input.sessionId
    );
    if (found) {
      storagePath = found;
      steps.push("storage_found_on_finalize");
      egressComplete = true;
    }
  }

  let finalPath = storagePath;
  let durationSeconds: number | undefined;
  let processMsg = egressComplete
    ? "Recording captured via LiveKit Egress."
    : "Awaiting LiveKit egress webhook for final file. Your library will update when processing completes.";

  if (isSupabaseS3Configured() && egressComplete) {
    try {
      const ff = await processRecordingWithFfmpeg(storagePath);
      finalPath = ff.path;
      durationSeconds = ff.durationSeconds;
      processMsg = ff.message;
      steps.push(ff.processed ? "ffmpeg_processed" : "ffmpeg_skipped");
    } catch (e) {
      console.warn("[finalize] ffmpeg", e);
      steps.push("ffmpeg_error_ignored");
    }
  } else if (!isSupabaseS3Configured()) {
    steps.push("s3_not_configured_await_webhook");
  }

  const markReady = egressComplete;

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
    const emailResult = await sendRecordingReadyEmail({
      userId: session.user_id,
      videoId,
      videoTitle: session.title,
      storagePath: finalPath,
    });
    steps.push(emailResult.sent ? "email_sent" : "email_skipped");
  } else {
    steps.push("awaiting_egress_webhook");
    console.info(
      "[finalize] leaving video processing — webhook should complete",
      { sessionId: input.sessionId, egressId, videoId }
    );
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
 * Resolves session/video via egress_id, room name, or storage path.
 */
export async function onEgressCompleted(input: {
  egressId: string;
  roomName?: string | null;
  filePath?: string | null;
  durationSeconds?: number | null;
}): Promise<PipelineResult> {
  const steps: string[] = ["webhook_received"];
  const admin = createAdminClient();
  console.info("[onEgressCompleted] start", {
    egressId: input.egressId,
    roomName: input.roomName,
    filePath: input.filePath,
  });

  // 1) Match session by egress_id
  let { data: session } = await admin
    .from("sessions")
    .select("*")
    .eq("egress_id", input.egressId)
    .maybeSingle();

  // 2) Match by LiveKit room name (session-{uuid} or stored livekit_room)
  if (!session && input.roomName) {
    const room = input.roomName;
    const byRoom = await admin
      .from("sessions")
      .select("*")
      .eq("livekit_room", room)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    session = byRoom.data;

    if (!session) {
      const sessionIdFromRoom = room.match(
        /session-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
      )?.[1];
      if (sessionIdFromRoom) {
        const byId = await admin
          .from("sessions")
          .select("*")
          .eq("id", sessionIdFromRoom)
          .maybeSingle();
        session = byId.data;
      }
    }
    if (session) steps.push("session_matched_by_room");
  }

  // 3) Match session id from file path userId/sessionId/...
  if (!session && input.filePath) {
    const ids = extractIdsFromPath(input.filePath);
    if (ids?.sessionId) {
      const byPath = await admin
        .from("sessions")
        .select("*")
        .eq("id", ids.sessionId)
        .maybeSingle();
      session = byPath.data;
      if (session) steps.push("session_matched_by_path");
    }
  }

  // Persist egress_id if we matched session without it
  if (session && session.egress_id !== input.egressId) {
    await admin
      .from("sessions")
      .update({ egress_id: input.egressId })
      .eq("id", session.id);
    steps.push("session_egress_id_backfilled");
  }

  // Match video
  let { data: video } = await admin
    .from("videos")
    .select("*")
    .eq("egress_id", input.egressId)
    .maybeSingle();

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

  const userId = session?.user_id;
  const sessionId = session?.id;

  // Create video row if we have a session but no video yet
  if (!video && session && userId && sessionId) {
    const videoId = await ensureVideoRow({
      sessionId,
      userId,
      title: session.title,
      sessionType: session.session_type,
    });
    const { data: created } = await admin
      .from("videos")
      .select("*")
      .eq("id", videoId)
      .single();
    video = created;
    steps.push("video_row_created");
  }

  if (!video || !userId || !sessionId) {
    console.error("[onEgressCompleted] no match", {
      egressId: input.egressId,
      roomName: input.roomName,
      filePath: input.filePath,
      hasSession: Boolean(session),
      hasVideo: Boolean(video),
    });
    return {
      success: false,
      mode: "livekit",
      steps: [...steps, "no_match"],
      error: "No matching video/session for egress",
    };
  }

  // Idempotent: already ready
  if (video.status === "ready" && video.storage_path) {
    steps.push("already_ready");
    return {
      success: true,
      mode: "livekit",
      steps,
      videoId: video.id,
      storagePath: video.storage_path,
    };
  }

  let storagePath =
    input.filePath ||
    video.storage_path ||
    session?.recording_path ||
    recordingStoragePath(userId, sessionId);

  storagePath = normalizeStoragePath(storagePath, userId, sessionId);
  steps.push(`path:${storagePath}`);

  // Confirm object exists in Supabase Storage (egress may finish a moment before object is visible)
  const { recordingExists } = await import("@/lib/storage/recordings");
  let exists = false;
  for (let i = 0; i < 6; i++) {
    exists = await recordingExists(storagePath);
    if (exists) break;
    // Try listing folder for any mp4 if exact path missing (timestamped filenames)
    if (i === 2 || i === 4) {
      const found = await findRecordingInFolder(userId, sessionId);
      if (found) {
        storagePath = found;
        exists = true;
        steps.push(`path_resolved_from_folder:${found}`);
        break;
      }
    }
    await sleep(1500);
  }
  steps.push(exists ? "storage_object_found" : "storage_object_not_found_yet");

  // Optional FFmpeg — never fail the pipeline if it errors
  let finalPath = storagePath;
  let durationSeconds = input.durationSeconds ?? undefined;
  let processMsg = exists
    ? "LiveKit egress complete — recording stored privately."
    : "LiveKit egress complete — file path recorded (storage visibility may lag).";

  try {
    const ff = await processRecordingWithFfmpeg(storagePath);
    finalPath = ff.path;
    durationSeconds = ff.durationSeconds ?? durationSeconds;
    processMsg = `${processMsg} ${ff.message}`;
    steps.push(ff.processed ? "ffmpeg_processed" : "ffmpeg_skipped");
  } catch (e) {
    console.warn("[onEgressCompleted] ffmpeg error", e);
    steps.push("ffmpeg_error_ignored");
  }

  const { error: updateError } = await admin
    .from("videos")
    .update({
      status: "ready",
      storage_path: finalPath,
      egress_id: input.egressId,
      duration_seconds: durationSeconds ?? null,
      category_tags: tagsForType(session?.session_type ?? "individual"),
      transcript_summary: processMsg.slice(0, 500),
    })
    .eq("id", video.id);

  if (updateError) {
    console.error("[onEgressCompleted] video update failed", updateError);
    return {
      success: false,
      mode: "livekit",
      steps: [...steps, "db_update_failed"],
      videoId: video.id,
      error: updateError.message,
    };
  }

  steps.push("video_ready");

  // Keep session recording_path in sync
  await admin
    .from("sessions")
    .update({
      recording_path: finalPath,
      egress_id: input.egressId,
      status: "completed",
    })
    .eq("id", sessionId);

  let emailResult;
  try {
    emailResult = await sendRecordingReadyEmail({
      userId,
      videoId: video.id,
      videoTitle: video.title || session?.title || "Session recording",
      storagePath: finalPath,
    });
    steps.push(emailResult.sent ? "email_sent" : `email_skipped:${emailResult.reason}`);
  } catch (e) {
    console.warn("[onEgressCompleted] email error", e);
    steps.push("email_error");
  }

  console.info("[onEgressCompleted] done", {
    videoId: video.id,
    storagePath: finalPath,
    steps,
  });

  return {
    success: true,
    mode: "livekit",
    steps,
    videoId: video.id,
    storagePath: finalPath,
  };
}

/** Mark video failed when LiveKit reports terminal egress failure */
export async function onEgressFailed(input: {
  egressId: string;
  roomName?: string | null;
  error: string;
}): Promise<PipelineResult> {
  const steps: string[] = ["webhook_failed_status"];
  const admin = createAdminClient();

  const { data: byEgress } = await admin
    .from("videos")
    .update({
      status: "failed",
      transcript_summary: `LiveKit egress failed: ${input.error}`.slice(0, 500),
    })
    .eq("egress_id", input.egressId)
    .select("id")
    .maybeSingle();

  if (byEgress?.id) {
    steps.push("video_failed_by_egress_id");
    return { success: true, mode: "livekit", steps, videoId: byEgress.id };
  }

  if (input.roomName) {
    const sessionIdFromRoom = input.roomName.match(
      /session-([0-9a-f-]{36})/i
    )?.[1];
    if (sessionIdFromRoom) {
      const { data: v } = await admin
        .from("videos")
        .update({
          status: "failed",
          transcript_summary: `LiveKit egress failed: ${input.error}`.slice(
            0,
            500
          ),
        })
        .eq("session_id", sessionIdFromRoom)
        .select("id")
        .maybeSingle();
      if (v?.id) {
        steps.push("video_failed_by_session");
        return { success: true, mode: "livekit", steps, videoId: v.id };
      }
    }
  }

  return {
    success: false,
    mode: "livekit",
    steps,
    error: "No video found to mark failed",
  };
}

function extractIdsFromPath(
  filePath: string
): { userId: string; sessionId: string } | null {
  const cleaned = filePath
    .replace(/^s3:\/\/[^/]+\//, "")
    .replace(/^https?:\/\/[^/]+\//, "")
    .replace(/^\//, "");
  // userId/sessionId/filename.mp4
  const m = cleaned.match(
    /^([0-9a-f-]{36})\/([0-9a-f-]{36})\/[^/]+$/i
  );
  if (!m) return null;
  return { userId: m[1], sessionId: m[2] };
}

async function findRecordingInFolder(
  userId: string,
  sessionId: string
): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const folder = `${userId}/${sessionId}`;
    const { data, error } = await admin.storage
      .from(
        (await import("@/lib/livekit/config")).RECORDINGS_BUCKET
      )
      .list(folder, { limit: 20 });
    if (error || !data?.length) return null;
    const mp4 = data.find((f) => f.name.toLowerCase().endsWith(".mp4"));
    return mp4 ? `${folder}/${mp4.name}` : null;
  } catch {
    return null;
  }
}

function normalizeStoragePath(
  filePath: string,
  userId: string,
  sessionId: string
): string {
  let p = filePath
    .replace(/^s3:\/\/[^/]+\//, "")
    .replace(/^\//, "");

  // Strip accidental bucket prefix
  const bucket =
    process.env.SUPABASE_STORAGE_BUCKET || "session-recordings";
  if (p.startsWith(`${bucket}/`)) {
    p = p.slice(bucket.length + 1);
  }

  // Full URL → fall back to canonical path
  if (/^https?:\/\//i.test(p)) {
    try {
      const u = new URL(p);
      const parts = u.pathname.split("/").filter(Boolean);
      // .../object/public/bucket/user/session/file or /storage/v1/s3/bucket/...
      const bucketIdx = parts.findIndex((x) => x === bucket);
      if (bucketIdx >= 0 && parts[bucketIdx + 1]) {
        return parts.slice(bucketIdx + 1).join("/");
      }
    } catch {
      /* ignore */
    }
    return recordingStoragePath(userId, sessionId);
  }

  // Path that already contains user + session ids
  if (p.includes(userId) && p.includes(sessionId)) {
    return p;
  }

  // Bare filename only
  if (!p.includes("/")) {
    return recordingStoragePath(userId, sessionId, p || "recording.mp4");
  }

  return p;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
