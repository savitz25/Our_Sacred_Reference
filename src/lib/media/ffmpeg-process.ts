import { spawn } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import {
  downloadRecording,
  uploadRecordingBuffer,
} from "@/lib/storage/recordings";

export type FfmpegResult = {
  processed: boolean;
  path: string;
  message: string;
  durationSeconds?: number;
};

/**
 * Optional post-process: trim leading/trailing silence + loudness normalize.
 * Requires `ffmpeg` on PATH (local/Docker worker). On Vercel serverless this
 * typically no-ops and returns the original LiveKit-encoded file.
 */
export async function processRecordingWithFfmpeg(
  storagePath: string
): Promise<FfmpegResult> {
  const hasFfmpeg = await ffmpegAvailable();
  if (!hasFfmpeg) {
    return {
      processed: false,
      path: storagePath,
      message:
        "FFmpeg not available in this runtime — using LiveKit egress encode (H.264 720p).",
    };
  }

  const input = await downloadRecording(storagePath);
  if (!input) {
    return {
      processed: false,
      path: storagePath,
      message: "Could not download recording for FFmpeg; keeping original path.",
    };
  }

  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "sr-ffmpeg-"));
  const inFile = path.join(tmp, "input.mp4");
  const outFile = path.join(tmp, "output.mp4");

  try {
    await fs.writeFile(inFile, input);

    // silenceremove: trim start/end quiet; loudnorm: audio normalize
    await runFfmpeg([
      "-y",
      "-i",
      inFile,
      "-af",
      "silenceremove=start_periods=1:start_silence=0.5:start_threshold=-40dB:detection=peak,areverse,silenceremove=start_periods=1:start_silence=0.5:start_threshold=-40dB:detection=peak,areverse,loudnorm=I=-16:TP=-1.5:LRA=11",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      "-metadata",
      "comment=Sacred Reference session recording",
      outFile,
    ]);

    const processed = await fs.readFile(outFile);
    const processedPath = storagePath.replace(
      /recording([^/]*)\.mp4$/i,
      "recording-processed.mp4"
    );
    await uploadRecordingBuffer(processedPath, processed, "video/mp4");

    const durationSeconds = await probeDuration(outFile);

    return {
      processed: true,
      path: processedPath,
      message: "FFmpeg: silence trimmed, audio normalized, faststart metadata.",
      durationSeconds,
    };
  } catch (e) {
    console.error("FFmpeg processing failed", e);
    return {
      processed: false,
      path: storagePath,
      message: `FFmpeg failed: ${e instanceof Error ? e.message : "unknown"}`,
    };
  } finally {
    await fs.rm(tmp, { recursive: true, force: true }).catch(() => {});
  }
}

function ffmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const p = spawn("ffmpeg", ["-version"]);
    p.on("error", () => resolve(false));
    p.on("close", (code) => resolve(code === 0));
  });
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    p.stderr?.on("data", (d) => {
      stderr += d.toString();
    });
    p.on("error", reject);
    p.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.slice(-800) || `ffmpeg exit ${code}`));
    });
  });
}

function probeDuration(file: string): Promise<number | undefined> {
  return new Promise((resolve) => {
    const p = spawn("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      file,
    ]);
    let out = "";
    p.stdout?.on("data", (d) => {
      out += d.toString();
    });
    p.on("error", () => resolve(undefined));
    p.on("close", () => {
      const n = parseFloat(out.trim());
      resolve(Number.isFinite(n) ? Math.round(n) : undefined);
    });
  });
}
