import { NextResponse } from "next/server";
import { EgressStatus, WebhookReceiver } from "livekit-server-sdk";
import {
  onEgressCompleted,
  onEgressFailed,
} from "@/lib/recording/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Allow enough time for storage checks + optional processing */
export const maxDuration = 60;

const log = (...args: unknown[]) =>
  console.info("[livekit-egress-webhook]", ...args);

/**
 * LiveKit Cloud webhook for egress lifecycle events.
 *
 * Dashboard → Project Settings → Webhooks:
 *   URL: https://www.oursacredreference.com/api/webhooks/livekit-egress
 *   Events: egress_started, egress_updated, egress_ended
 *   Auth: same LIVEKIT_API_KEY + LIVEKIT_API_SECRET
 *
 * GET returns a lightweight health payload for deploy checks.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/webhooks/livekit-egress",
    expects: ["egress_ended", "egress_updated"],
    livekitConfigured: Boolean(
      process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET
    ),
  });
}

export async function POST(request: Request) {
  const started = Date.now();
  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (!apiKey || !apiSecret) {
      log("reject: LiveKit env missing");
      return NextResponse.json(
        { error: "LiveKit not configured" },
        { status: 503 }
      );
    }

    const body = await request.text();
    // LiveKit may send Authorization or Authorize; JWT may include "Bearer "
    const rawAuth =
      request.headers.get("Authorization") ||
      request.headers.get("Authorize") ||
      "";
    const authHeader = rawAuth.replace(/^Bearer\s+/i, "").trim();

    const receiver = new WebhookReceiver(apiKey, apiSecret);
    let event;
    try {
      event = await receiver.receive(body, authHeader);
    } catch (err) {
      // Retry without stripping Bearer in case verifier expects full header
      try {
        event = await receiver.receive(body, rawAuth);
      } catch (err2) {
        console.error("[livekit-egress-webhook] auth failed", err2);
        return NextResponse.json(
          {
            error: "Invalid signature",
            detail: err2 instanceof Error ? err2.message : String(err2),
          },
          { status: 401 }
        );
      }
    }

    const eventName = String(event.event || "");
    log("event", {
      event: eventName,
      hasEgress: Boolean(event.egressInfo),
      bodyBytes: body.length,
    });

    if (
      eventName !== "egress_ended" &&
      eventName !== "egress_updated" &&
      eventName !== "egress_started"
    ) {
      return NextResponse.json({ ok: true, ignored: eventName });
    }

    const egress = event.egressInfo;
    if (!egress?.egressId) {
      log("ignored: no egressInfo.egressId");
      return NextResponse.json({ ok: true, ignored: "no egress info" });
    }

    const status = normalizeEgressStatus(egress.status);
    const roomName = egress.roomName || "";
    const fileResults = Array.isArray(egress.fileResults)
      ? egress.fileResults
      : [];
    const filePath =
      fileResults[0]?.filename ||
      fileResults[0]?.location ||
      null;
    const durationNs = fileResults[0]?.duration;
    const durationSeconds =
      durationNs != null && Number(durationNs) > 0
        ? Math.round(Number(durationNs) / 1e9)
        : null;

    log("egress payload", {
      egressId: egress.egressId,
      status,
      statusRaw: egress.status,
      roomName,
      filePath,
      fileResultsCount: fileResults.length,
      error: egress.error || null,
      eventName,
    });

    if (eventName === "egress_started") {
      return NextResponse.json({
        ok: true,
        started: true,
        egressId: egress.egressId,
      });
    }

    // Failed terminal states
    if (
      status === EgressStatus.EGRESS_FAILED ||
      status === EgressStatus.EGRESS_ABORTED ||
      status === EgressStatus.EGRESS_LIMIT_REACHED
    ) {
      const failMsg = egress.error || `LiveKit egress status ${status}`;
      log("egress failed", { egressId: egress.egressId, failMsg });
      const failResult = await onEgressFailed({
        egressId: egress.egressId,
        roomName,
        error: failMsg,
      });
      return NextResponse.json({
        ok: true,
        failed: true,
        result: failResult,
        ms: Date.now() - started,
      });
    }

    const isComplete =
      status === EgressStatus.EGRESS_COMPLETE ||
      (eventName === "egress_ended" &&
        status !== EgressStatus.EGRESS_FAILED &&
        status !== EgressStatus.EGRESS_ABORTED);

    // Still running — wait for next update / ended
    if (eventName === "egress_updated" && !isComplete && !filePath) {
      return NextResponse.json({
        ok: true,
        pending: true,
        status,
        egressId: egress.egressId,
      });
    }

    // On egress_ended, always attempt finalize even if status parsing is odd
    // as long as we are not in an explicit failure state.
    if (eventName === "egress_ended" || isComplete || filePath) {
      const result = await onEgressCompleted({
        egressId: egress.egressId,
        roomName,
        filePath,
        durationSeconds,
      });

      log("finalize result", {
        success: result.success,
        steps: result.steps,
        videoId: result.videoId,
        storagePath: result.storagePath,
        error: result.error,
        ms: Date.now() - started,
      });

      // Return 200 even on logical miss so LiveKit does not infinite-retry
      // bad payloads — we log for debugging. Return 500 only on throw.
      return NextResponse.json({
        ok: result.success,
        result,
        ms: Date.now() - started,
      });
    }

    return NextResponse.json({
      ok: true,
      ignored: "not complete yet",
      status,
      egressId: egress.egressId,
    });
  } catch (e) {
    console.error("[livekit-egress-webhook] unhandled", e);
    return NextResponse.json(
      {
        error: "Webhook handler error",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}

function normalizeEgressStatus(status: unknown): number {
  if (typeof status === "number" && !Number.isNaN(status)) return status;
  if (typeof status === "string") {
    const upper = status.toUpperCase();
    if (upper in EgressStatus) {
      return EgressStatus[upper as keyof typeof EgressStatus] as number;
    }
    const n = Number(status);
    if (!Number.isNaN(n)) return n;
  }
  // protobuf enums sometimes arrive as objects with value
  if (status && typeof status === "object" && "value" in (status as object)) {
    return normalizeEgressStatus((status as { value: unknown }).value);
  }
  return -1;
}
