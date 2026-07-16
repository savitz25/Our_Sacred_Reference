import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { finalizeSessionRecording } from "@/lib/recording/pipeline";

/**
 * Stop LiveKit egress and kick off post-session pipeline.
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

    const result = await finalizeSessionRecording({
      sessionId,
      userId: session.user_id,
      videoId: body.videoId,
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("recording/stop", e);
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Failed to stop recording",
      },
      { status: 500 }
    );
  }
}
