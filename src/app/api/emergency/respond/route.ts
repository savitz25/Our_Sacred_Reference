import { NextResponse } from "next/server";
import { respondToEmergencyProposal } from "@/app/actions/emergency";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Email Accept / Decline links land here (tokenized, no login required).
 * GET ?token=...&action=accept|decline
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  const action = url.searchParams.get("action");
  const site = getSiteUrl();

  if (action !== "accept" && action !== "decline") {
    return NextResponse.redirect(
      `${site}/portal?emergency=error&msg=${encodeURIComponent("Invalid response link.")}`
    );
  }

  const result = await respondToEmergencyProposal({ token, action });
  if (!result.success) {
    return NextResponse.redirect(
      `${site}/portal?emergency=error&msg=${encodeURIComponent(result.error || "Could not process response.")}`
    );
  }

  if (result.redirectTo?.startsWith("/portal/session/")) {
    return NextResponse.redirect(`${site}${result.redirectTo}`);
  }

  const qs = new URLSearchParams({
    emergency: action === "accept" ? "accepted" : "declined",
  });
  if (result.sessionId) qs.set("session", result.sessionId);
  if (result.message) qs.set("msg", result.message);

  return NextResponse.redirect(`${site}/portal?${qs.toString()}`);
}

export async function POST(request: Request) {
  return GET(request);
}
