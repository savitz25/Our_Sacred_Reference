import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const roomName = body.roomName as string | undefined;
    const sessionId = body.sessionId as string | undefined;

    if (!roomName && !sessionId) {
      return NextResponse.json(
        { error: "roomName or sessionId required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    let room = roomName;
    let canJoin = false;
    const isPractitioner =
      profile?.role === "practitioner" || profile?.role === "admin";

    if (sessionId) {
      const { data: session } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (!session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      canJoin = session.user_id === user.id || isPractitioner;
      room = session.livekit_room || `session-${session.id}`;
    } else {
      canJoin = true;
    }

    if (!canJoin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json({
        configured: false,
        roomName: room,
        identity: user.id,
        name: profile?.full_name || user.email,
        isPractitioner,
        message:
          "LiveKit env vars not set. Session UI will run in demo mode.",
      });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: profile?.full_name || user.email || "Guest",
      ttl: "2h",
    });

    at.addGrant({
      roomJoin: true,
      room: room!,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      // Recording control is practitioner-side via LiveKit egress API later
    });

    const token = await at.toJwt();

    return NextResponse.json({
      configured: true,
      token,
      url: wsUrl,
      roomName: room,
      identity: user.id,
      name: profile?.full_name || user.email,
      isPractitioner,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 }
    );
  }
}
