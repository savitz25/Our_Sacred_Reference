import { createAdminClient } from "@/lib/supabase/admin";

export async function sendRecordingReadyEmail(userId: string, videoTitle: string) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return { sent: false, reason: "RESEND_API_KEY not set" as const };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .single();

  if (!profile?.email) {
    return { sent: false, reason: "no email" as const };
  }

  const site =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:
        process.env.RESEND_FROM_EMAIL ||
        "Sacred Reference <onboarding@resend.dev>",
      to: [profile.email],
      subject: "Your session recording is ready",
      html: `<p>Hello ${profile.full_name || "there"},</p>
        <p>Your recording <strong>${escapeHtml(videoTitle)}</strong> has been processed and added to your private library.</p>
        <p><a href="${site}/portal/library">Open session library</a></p>
        <p>— Sacred Reference</p>`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Resend error", text);
    return { sent: false, reason: text };
  }

  return { sent: true as const };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
