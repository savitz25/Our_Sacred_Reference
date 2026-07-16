import { NextResponse } from "next/server";
import { WebhookReceiver } from "livekit-server-sdk";
import { onEgressCompleted } from "@/lib/recording/pipeline";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * LiveKit webhook receiver for egress_ended / egress_updated events.
 * Configure in LiveKit Cloud: https://your-domain/api/webhooks/livekit-egress
 * with LIVEKIT_API_KEY + LIVEKIT_API_SECRET (same as API credentials).
 */
export async function POST(request: Request) {
  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "LiveKit not configured" },
        { status: 503 }
      );
    }

    const body = await request.text();
    const authHeader = request.headers.get("Authorization") || "";

    const receiver = new WebhookReceiver(apiKey, apiSecret);
    let event;
    try {
      event = await receiver.receive(body, authHeader);
    } catch (err) {
      console.error("LiveKit webhook auth failed", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const eventName = event.event;
    // egress_ended is the primary completion event
    if (eventName !== "egress_ended" && eventName !== "egress_updated") {
      return NextResponse.json({ ok: true, ignored: eventName });
    }

    const egress = event.egressInfo;
    if (!egress?.egressId) {
      return NextResponse.json({ ok: true, ignored: "no egress info" });
    }

    const status = egress.status;
    // Status 3 = EGRESS_COMPLETE in LiveKit
    const isComplete =
      status === 3 ||
      String(status).includes("COMPLETE") ||
      // protobuf enum numeric
      status === ("EGRESS_COMPLETE" as unknown as number);

    // Also check stringified
    const statusStr = String(status);
    const complete =
      isComplete ||
      statusStr === "3" ||
      statusStr === "EGRESS_COMPLETE" ||
      egress.error === "";

    if (eventName === "egress_updated" && !complete) {
      return NextResponse.json({ ok: true, pending: true });
    }

    // Failed statuses
    if (
      statusStr.includes("FAILED") ||
      statusStr.includes("ABORTED") ||
      status === 4 ||
      status === 5
    ) {
      const admin = createAdminClient();
      await admin
        .from("videos")
        .update({
          status: "failed",
          transcript_summary: `LiveKit egress failed: ${egress.error || statusStr}`,
        })
        .eq("egress_id", egress.egressId);
      return NextResponse.json({ ok: true, failed: true });
    }

    const fileResults = egress.fileResults || [];
    const filePath =
      fileResults[0]?.filename ||
      fileResults[0]?.location ||
      null;
    const durationNs = fileResults[0]?.duration;
    const durationSeconds =
      durationNs != null
        ? Math.round(Number(durationNs) / 1e9)
        : null;

    const result = await onEgressCompleted({
      egressId: egress.egressId,
      filePath,
      durationSeconds,
    });

    return NextResponse.json({ ok: true, result });
  } catch (e) {
    console.error("livekit-egress webhook", e);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }
}
