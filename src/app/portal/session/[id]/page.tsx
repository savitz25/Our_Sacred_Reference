import { notFound } from "next/navigation";
import { VideoRoom } from "@/components/portal/VideoRoom";
import { SessionEarlyWait } from "@/components/portal/SessionEarlyWait";
import { SessionEnded } from "@/components/portal/SessionEnded";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSessionTiming } from "@/lib/sessions/timing";

export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await requireProfile(
    `/portal/session/${id}`
  );
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

  // Practitioners may enter early to prepare the room
  if (timing.state === "early" && !isPractitioner) {
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

  if (timing.state === "ended" && !isPractitioner) {
    return (
      <SessionEnded
        sessionTitle={session.title}
        scheduledAt={session.scheduled_at}
      />
    );
  }

  // Live room — stays on Sacred Reference (no external redirects)
  return (
    <VideoRoom
      sessionId={session.id}
      sessionTitle={session.title}
      isPractitioner={isPractitioner}
    />
  );
}
