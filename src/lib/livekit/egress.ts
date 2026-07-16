import {
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  EncodingOptionsPreset,
  S3Upload,
  type EgressInfo,
} from "livekit-server-sdk";
import {
  getLiveKitHttpHost,
  getSupabaseS3Endpoint,
  isLiveKitConfigured,
  isSupabaseS3Configured,
  RECORDINGS_BUCKET,
  recordingStoragePath,
} from "@/lib/livekit/config";

export function createEgressClient(): EgressClient {
  if (!isLiveKitConfigured()) {
    throw new Error("LiveKit is not configured");
  }
  return new EgressClient(
    getLiveKitHttpHost(),
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!
  );
}

function buildFileOutput(filepath: string): EncodedFileOutput {
  if (!isSupabaseS3Configured()) {
    // File output without S3 — LiveKit Cloud still produces a file result
    // accessible via egress info; prefer configuring Supabase S3 for production.
    return new EncodedFileOutput({
      fileType: EncodedFileType.MP4,
      filepath,
      disableManifest: false,
    });
  }

  return new EncodedFileOutput({
    fileType: EncodedFileType.MP4,
    filepath,
    disableManifest: false,
    output: {
      case: "s3",
      value: new S3Upload({
        accessKey: process.env.SUPABASE_S3_ACCESS_KEY!,
        secret: process.env.SUPABASE_S3_SECRET_KEY!,
        bucket: RECORDINGS_BUCKET,
        endpoint: getSupabaseS3Endpoint(),
        region: process.env.SUPABASE_S3_REGION || "us-east-1",
        forcePathStyle: true,
        metadata: {
          "app": "sacred-reference",
          "purpose": "session-recording",
        },
      }),
    },
  });
}

/**
 * Start RoomCompositeEgress — best for 1:1 sessions (both participants in one MP4).
 */
export async function startRoomRecording(input: {
  roomName: string;
  userId: string;
  sessionId: string;
}): Promise<{ egressId: string; filepath: string; info: EgressInfo }> {
  const client = createEgressClient();
  const filepath = recordingStoragePath(
    input.userId,
    input.sessionId,
    "recording-{time}.mp4"
  );
  // LiveKit supports {time} template; we also track the logical path
  const logicalPath = recordingStoragePath(
    input.userId,
    input.sessionId,
    "recording.mp4"
  );

  const output = buildFileOutput(filepath);

  const info = await client.startRoomCompositeEgress(input.roomName, output, {
    layout: "grid",
    audioOnly: false,
    // H.264 720p is a solid balance for coaching sessions
    encodingOptions: EncodingOptionsPreset.H264_720P_30,
  });

  return {
    egressId: info.egressId,
    filepath: logicalPath,
    info,
  };
}

export async function stopRoomRecording(
  egressId: string
): Promise<EgressInfo> {
  const client = createEgressClient();
  return client.stopEgress(egressId);
}

export async function listActiveEgress(roomName?: string): Promise<EgressInfo[]> {
  const client = createEgressClient();
  return client.listEgress({
    roomName,
    active: true,
  });
}

export async function getEgressInfo(egressId: string): Promise<EgressInfo | null> {
  const client = createEgressClient();
  const list = await client.listEgress({ egressId });
  return list[0] ?? null;
}

/** Extract primary file path from completed egress info */
export function extractEgressFilePath(info: EgressInfo): string | null {
  const results = info.fileResults;
  if (results && results.length > 0) {
    return results[0].filename || results[0].location || null;
  }
  return null;
}
