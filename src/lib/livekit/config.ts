/** LiveKit + Supabase S3 helpers for Egress */

export function isLiveKitConfigured(): boolean {
  return Boolean(
    process.env.LIVEKIT_API_KEY &&
      process.env.LIVEKIT_API_SECRET &&
      process.env.NEXT_PUBLIC_LIVEKIT_URL
  );
}

/** Convert wss://host → https://host for server SDK */
export function getLiveKitHttpHost(): string {
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";
  return url
    .replace(/^wss:\/\//i, "https://")
    .replace(/^ws:\/\//i, "http://")
    .replace(/\/$/, "");
}

export function isSupabaseS3Configured(): boolean {
  return Boolean(
    process.env.SUPABASE_S3_ACCESS_KEY &&
      process.env.SUPABASE_S3_SECRET_KEY &&
      (process.env.SUPABASE_S3_ENDPOINT || process.env.NEXT_PUBLIC_SUPABASE_URL)
  );
}

export function getSupabaseS3Endpoint(): string {
  if (process.env.SUPABASE_S3_ENDPOINT) {
    return process.env.SUPABASE_S3_ENDPOINT.replace(/\/$/, "");
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_S3_ENDPOINT required");
  }
  return `${base}/storage/v1/s3`;
}

export const RECORDINGS_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || "session-recordings";

export function recordingStoragePath(
  userId: string,
  sessionId: string,
  filename = "recording.mp4"
): string {
  return `${userId}/${sessionId}/${filename}`;
}
