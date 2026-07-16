import { createAdminClient } from "@/lib/supabase/admin";
import { RECORDINGS_BUCKET } from "@/lib/livekit/config";

/**
 * Create a short-lived signed URL for a private recording.
 * Only call after authorizing the requesting user.
 */
export async function createSignedRecordingUrl(
  storagePath: string,
  expiresInSeconds = 60 * 60
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(RECORDINGS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) {
    console.error("signed URL error", error);
    return null;
  }
  return data.signedUrl;
}

/**
 * Upload a processed buffer to the private session-recordings bucket.
 */
export async function uploadRecordingBuffer(
  storagePath: string,
  data: Buffer,
  contentType = "video/mp4"
): Promise<{ path: string }> {
  const admin = createAdminClient();
  const { error } = await admin.storage
    .from(RECORDINGS_BUCKET)
    .upload(storagePath, data, {
      contentType,
      upsert: true,
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }
  return { path: storagePath };
}

/**
 * Download a recording from private storage (for FFmpeg post-processing).
 */
export async function downloadRecording(
  storagePath: string
): Promise<Buffer | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(RECORDINGS_BUCKET)
    .download(storagePath);

  if (error || !data) {
    console.error("download error", error);
    return null;
  }
  const ab = await data.arrayBuffer();
  return Buffer.from(ab);
}

/**
 * Check whether an object exists in the bucket.
 */
export async function recordingExists(storagePath: string): Promise<boolean> {
  const admin = createAdminClient();
  const folder = storagePath.includes("/")
    ? storagePath.slice(0, storagePath.lastIndexOf("/"))
    : "";
  const name = storagePath.includes("/")
    ? storagePath.slice(storagePath.lastIndexOf("/") + 1)
    : storagePath;

  const { data, error } = await admin.storage
    .from(RECORDINGS_BUCKET)
    .list(folder, { search: name });

  if (error) return false;
  return (data ?? []).some((f) => f.name === name);
}
