import { notFound } from "next/navigation";
import { VideoRoom } from "@/components/portal/VideoRoom";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await requireProfile();
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

  return (
    <VideoRoom
      sessionId={session.id}
      sessionTitle={session.title}
      isPractitioner={isPractitioner}
    />
  );
}
