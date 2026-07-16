import { notFound, redirect } from "next/navigation";
import { SessionEarlyWait } from "@/components/portal/SessionEarlyWait";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSessionTiming } from "@/lib/sessions/timing";

export const dynamic = "force-dynamic";

/**
 * Explicit early-wait route: /portal/session/[id]/early
 * Used when Start Session is clicked before the join window.
 * If the window is already open, send the client to the main lobby.
 */
export default async function SessionEarlyWaitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await requireProfile(`/portal/session/${id}/early`);
  const supabase = await createClient();

  const isPractitioner =
    profile.role === "practitioner" || profile.role === "admin";

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!session) {
    notFound();
  }

  if (session.user_id !== user.id && !isPractitioner) {
    notFound();
  }

  const timing = getSessionTiming({
    scheduledAt: session.scheduled_at,
    durationMinutes: session.duration_minutes ?? 60,
  });

  // Room already open or past — go to main session page (lobby / ended)
  if (timing.state !== "early") {
    redirect(`/portal/session/${id}`);
  }

  return (
    <SessionEarlyWait
      sessionId={session.id}
      sessionTitle={session.title}
      scheduledAt={session.scheduled_at}
      durationMinutes={session.duration_minutes ?? 60}
      practitionerName="Michele"
    />
  );
}
