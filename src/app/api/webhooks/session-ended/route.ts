import { NextResponse } from "next/server";
import { finalizeSessionRecording } from "@/lib/recording/pipeline";

/**
 * Post-session automation pipeline.
 * Stops LiveKit RoomCompositeEgress, runs optional FFmpeg, updates videos,
 * and triggers Resend when ready (or defers to livekit-egress webhook).
 */
export async function POST(request: Request) {
  const auth = request.headers.get("Authorization");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (process.env.NODE_ENV === "production") {
    if (!serviceKey || auth !== `Bearer ${serviceKey}`) {
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

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: "sessionId and userId required" },
        { status: 400 }
      );
    }

    const result = await finalizeSessionRecording({
      sessionId,
      userId,
      videoId,
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("session-ended webhook error", e);
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Pipeline failed",
      },
      { status: 500 }
    );
  }
}
