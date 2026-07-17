"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendEmergencyAcceptedToPractitioner,
  sendEmergencyDeclinedToPractitioner,
  sendEmergencyProposalToClient,
  sendEmergencyRequestToPractitioner,
} from "@/lib/email";
import type { EmergencyRequest } from "@/lib/database.types";

export type EmergencyActionResult = {
  success: boolean;
  error?: string;
  message?: string;
  requestId?: string;
  sessionId?: string;
  redirectTo?: string;
};

const DELAY_OPTIONS = [0, 15, 30, 45, 60] as const;
export type EmergencyDelayMinutes = (typeof DELAY_OPTIONS)[number];

function newToken() {
  return randomBytes(24).toString("hex");
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Please sign in." };
  return { ok: true as const, user, supabase };
}

async function requirePractitioner() {
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const { data: profile } = await auth.supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (profile?.role !== "practitioner" && profile?.role !== "admin") {
    return { ok: false as const, error: "Not authorized." };
  }
  return { ok: true as const, user: auth.user, supabase: auth.supabase, profile };
}

/** Client: submit emergency session request */
export async function submitEmergencyRequest(input: {
  reason?: string;
}): Promise<EmergencyActionResult> {
  try {
    const auth = await requireUser();
    if (!auth.ok) return { success: false, error: auth.error };

    const { data: profile } = await auth.supabase
      .from("profiles")
      .select("email, full_name, role")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (!profile?.email) {
      return { success: false, error: "Your profile needs an email address." };
    }

    // Prevent spam: one open pending/proposed request at a time
    const { data: open } = await auth.supabase
      .from("emergency_requests")
      .select("id, status")
      .eq("user_id", auth.user.id)
      .in("status", ["pending", "proposed"])
      .limit(1);

    if (open && open.length > 0) {
      return {
        success: false,
        error:
          open[0].status === "proposed"
            ? "You already have a proposal waiting — check your email to accept or decline."
            : "You already have a pending emergency request. Michele will respond soon.",
      };
    }

    const token = newToken();
    const reason = input.reason?.trim().slice(0, 1000) || null;

    const { data: row, error } = await auth.supabase
      .from("emergency_requests")
      .insert({
        user_id: auth.user.id,
        reason,
        status: "pending",
        response_token: token,
      })
      .select("id")
      .single();

    if (error || !row) {
      console.error("[emergency] insert:", error);
      return {
        success: false,
        error:
          error?.message?.includes("emergency_requests") ||
          error?.code === "42P01"
            ? "Emergency requests are not enabled yet. Please run migration 007 in Supabase."
            : error?.message || "Could not submit request.",
      };
    }

    try {
      await sendEmergencyRequestToPractitioner({
        clientName: profile.full_name || profile.email,
        clientEmail: profile.email,
        reason,
      });
    } catch (e) {
      console.warn("[emergency] notify practitioner:", e);
    }

    revalidatePath("/portal");
    revalidatePath("/admin");

    return {
      success: true,
      requestId: row.id,
      message:
        "Your emergency request was sent to Michele. You will receive an email when she proposes a time.",
    };
  } catch (e) {
    console.error("[emergency] submit:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unexpected error.",
    };
  }
}

/** Practitioner: propose instant or delayed session */
export async function proposeEmergencySession(input: {
  requestId: string;
  delayMinutes: EmergencyDelayMinutes;
  practitionerNote?: string;
}): Promise<EmergencyActionResult> {
  try {
    const auth = await requirePractitioner();
    if (!auth.ok) return { success: false, error: auth.error };

    if (!DELAY_OPTIONS.includes(input.delayMinutes)) {
      return { success: false, error: "Invalid delay option." };
    }

    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return {
        success: false,
        error: "Server configuration error. Try again later.",
      };
    }

    const { data: req, error: fetchErr } = await admin
      .from("emergency_requests")
      .select("*")
      .eq("id", input.requestId)
      .maybeSingle();

    if (fetchErr || !req) {
      return { success: false, error: "Request not found." };
    }
    if (req.status !== "pending" && req.status !== "proposed") {
      return {
        success: false,
        error: `This request is already ${req.status}.`,
      };
    }

    const { data: client } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", req.user_id)
      .maybeSingle();

    if (!client?.email) {
      return { success: false, error: "Client profile has no email." };
    }

    const proposedAt = new Date(
      Date.now() + input.delayMinutes * 60 * 1000
    );
    const duration = 45;
    const title =
      input.delayMinutes === 0
        ? "Emergency Session (Instant)"
        : `Emergency Session (in ${input.delayMinutes} min)`;

    // Create or update linked session
    let sessionId = req.session_id;
    if (sessionId) {
      await admin
        .from("sessions")
        .update({
          scheduled_at: proposedAt.toISOString(),
          title,
          status: "confirmed",
          notes: [
            req.reason ? `Emergency reason: ${req.reason}` : null,
            input.practitionerNote
              ? `Practitioner note: ${input.practitionerNote}`
              : null,
            "[emergency_session]",
          ]
            .filter(Boolean)
            .join("\n"),
          reminder_1h_sent_at: null,
        })
        .eq("id", sessionId);
    } else {
      const { data: session, error: sessErr } = await admin
        .from("sessions")
        .insert({
          user_id: req.user_id,
          therapist_id: auth.user.id,
          title,
          session_type: "other",
          scheduled_at: proposedAt.toISOString(),
          duration_minutes: duration,
          status: "confirmed",
          recording_enabled: true,
          notes: [
            req.reason ? `Emergency reason: ${req.reason}` : null,
            input.practitionerNote
              ? `Practitioner note: ${input.practitionerNote}`
              : null,
            "[emergency_session]",
          ]
            .filter(Boolean)
            .join("\n"),
        })
        .select("id")
        .single();

      if (sessErr || !session) {
        console.error("[emergency] session create:", sessErr);
        return {
          success: false,
          error: sessErr?.message || "Could not create session.",
        };
      }
      sessionId = session.id;
      await admin
        .from("sessions")
        .update({
          meeting_url: `/portal/session/${sessionId}`,
          livekit_room: `session-${sessionId}`,
        })
        .eq("id", sessionId);
    }

    const { error: upErr } = await admin
      .from("emergency_requests")
      .update({
        status: "proposed",
        delay_minutes: input.delayMinutes,
        proposed_at: proposedAt.toISOString(),
        proposed_by: auth.user.id,
        practitioner_note: input.practitionerNote?.trim().slice(0, 500) || null,
        session_id: sessionId,
      })
      .eq("id", req.id);

    if (upErr) {
      console.error("[emergency] propose update:", upErr);
      return { success: false, error: upErr.message };
    }

    // Ensure token exists
    let token = req.response_token;
    if (!token) {
      token = newToken();
      await admin
        .from("emergency_requests")
        .update({ response_token: token })
        .eq("id", req.id);
    }

    try {
      await sendEmergencyProposalToClient({
        to: client.email,
        fullName: client.full_name || client.email,
        proposedAt,
        delayMinutes: input.delayMinutes,
        responseToken: token,
      });
    } catch (e) {
      console.warn("[emergency] proposal email:", e);
    }

    revalidatePath("/admin");
    revalidatePath("/portal");

    return {
      success: true,
      requestId: req.id,
      sessionId: sessionId ?? undefined,
      message:
        input.delayMinutes === 0
          ? "Instant meeting proposed. The client was emailed Accept / Decline links."
          : `Session proposed in ${input.delayMinutes} minutes. The client was emailed Accept / Decline links.`,
    };
  } catch (e) {
    console.error("[emergency] propose:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unexpected error.",
    };
  }
}

/** Client (or token): accept proposal */
export async function respondToEmergencyProposal(input: {
  token: string;
  action: "accept" | "decline";
}): Promise<EmergencyActionResult> {
  try {
    const token = input.token?.trim();
    if (!token) return { success: false, error: "Missing token." };

    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return { success: false, error: "Server configuration error." };
    }

    const { data: req, error } = await admin
      .from("emergency_requests")
      .select("*")
      .eq("response_token", token)
      .maybeSingle();

    if (error || !req) {
      return { success: false, error: "This link is invalid or expired." };
    }

    if (req.status === "accepted") {
      return {
        success: true,
        sessionId: req.session_id ?? undefined,
        redirectTo: req.session_id
          ? `/portal/session/${req.session_id}`
          : "/portal",
        message: "Already accepted.",
      };
    }
    if (req.status === "declined") {
      return {
        success: true,
        message: "This proposal was already declined.",
        redirectTo: "/portal",
      };
    }
    if (req.status !== "proposed") {
      return {
        success: false,
        error: "This request is not awaiting your response.",
      };
    }

    const { data: client } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", req.user_id)
      .maybeSingle();

    if (input.action === "decline") {
      await admin
        .from("emergency_requests")
        .update({
          status: "declined",
          client_responded_at: new Date().toISOString(),
        })
        .eq("id", req.id);

      if (req.session_id) {
        await admin
          .from("sessions")
          .update({ status: "cancelled" })
          .eq("id", req.session_id);
      }

      if (client?.email) {
        try {
          await sendEmergencyDeclinedToPractitioner({
            clientName: client.full_name || client.email,
            clientEmail: client.email,
            proposedAt: req.proposed_at ? new Date(req.proposed_at) : null,
          });
        } catch (e) {
          console.warn("[emergency] decline notify:", e);
        }
      }

      revalidatePath("/admin");
      revalidatePath("/portal");
      return {
        success: true,
        message: "You declined this emergency session. Michele has been notified.",
        redirectTo: "/portal",
      };
    }

    // Accept
    await admin
      .from("emergency_requests")
      .update({
        status: "accepted",
        client_responded_at: new Date().toISOString(),
      })
      .eq("id", req.id);

    if (req.session_id) {
      await admin
        .from("sessions")
        .update({
          status: "confirmed",
          // Clear reminder flag so 1h cron can fire for delayed sessions
          reminder_1h_sent_at: null,
        })
        .eq("id", req.session_id);
    }

    const isInstant =
      (req.delay_minutes ?? 0) === 0 ||
      (req.proposed_at
        ? new Date(req.proposed_at).getTime() <= Date.now() + 2 * 60 * 1000
        : false);

    if (client?.email && req.session_id && req.proposed_at) {
      try {
        await sendEmergencyAcceptedToPractitioner({
          clientName: client.full_name || client.email,
          clientEmail: client.email,
          proposedAt: new Date(req.proposed_at),
          isInstant,
          sessionId: req.session_id,
        });
      } catch (e) {
        console.warn("[emergency] accept notify:", e);
      }
    }

    revalidatePath("/admin");
    revalidatePath("/portal");

    const sessionId = req.session_id ?? undefined;
    return {
      success: true,
      sessionId,
      redirectTo: sessionId
        ? isInstant
          ? `/portal/session/${sessionId}`
          : `/portal?emergency=accepted&session=${sessionId}`
        : "/portal",
      message: isInstant
        ? "Accepted. Opening your secure session room…"
        : "Accepted. Your emergency session is scheduled — you will get a 1-hour reminder when applicable.",
    };
  } catch (e) {
    console.error("[emergency] respond:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unexpected error.",
    };
  }
}

export type EmergencyRequestAdminRow = EmergencyRequest & {
  client_name: string | null;
  client_email: string | null;
};

export async function listEmergencyRequestsForAdmin(): Promise<
  EmergencyRequestAdminRow[]
> {
  try {
    const auth = await requirePractitioner();
    if (!auth.ok) return [];

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("emergency_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data) {
      console.error("[emergency] list:", error);
      return [];
    }

    const userIds = [...new Set(data.map((r) => r.user_id))];
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    const map = new Map(
      (profiles ?? []).map((p) => [p.id, p] as const)
    );

    return data.map((r) => ({
      ...r,
      client_name: map.get(r.user_id)?.full_name ?? null,
      client_email: map.get(r.user_id)?.email ?? null,
    }));
  } catch (e) {
    console.error("[emergency] list threw:", e);
    return [];
  }
}
