import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { beginSessionRecording } from "@/lib/recording/pipeline";

/**
 * Start RoomCompositeEgress for a session room.
 * Practitioner (or owner) can start; typically auto-called when joining.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sessionId = body.sessionId as string | undefined;
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: session } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isPractitioner =
      profile?.role === "practitioner" || profile?.role === "admin";
    if (session.user_id !== user.id && !isPractitioner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!session.recording_enabled) {
      return NextResponse.json({
        started: false,
        reason: "Recording disabled for this session",
      });
    }

    const result = await beginSessionRecording({
      sessionId,
      roomName: session.livekit_room || `session-${sessionId}`,
      userId: session.user_id,
    });

    if ("demo" in result) {
      return NextResponse.json({
        started: false,
        demo: true,
        reason: result.reason,
      });
    }

    return NextResponse.json({
      started: true,
      egressId: result.egressId,
      filepath: result.filepath,
    });
  } catch (e) {
    console.error("recording/start", e);
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Failed to start recording",
      },
      { status: 500 }
    );
  }
}
