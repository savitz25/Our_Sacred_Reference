import { Suspense } from "react";
import Link from "next/link";
import { Film, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { UpcomingSessionsPanel } from "@/components/portal/UpcomingSessionsPanel";
import { EmergencyRequestButton } from "@/components/portal/EmergencyRequestButton";
import { EmergencyPortalBanner } from "@/components/portal/EmergencyPortalBanner";

export default async function PortalDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { profile, user } = await requireProfile();
  const supabase = await createClient();
  const now = new Date().toISOString();
  const sp = searchParams ? await searchParams : {};

  const { data: upcoming } = await supabase
    .from("sessions")
    .select("id, title, scheduled_at, duration_minutes, status")
    .eq("user_id", user.id)
    .gte("scheduled_at", now)
    .neq("status", "cancelled")
    .order("scheduled_at", { ascending: true })
    .limit(5);

  // Practitioners see all upcoming
  let practitionerUpcoming = upcoming;
  if (profile.role === "practitioner" || profile.role === "admin") {
    const { data } = await supabase
      .from("sessions")
      .select("id, title, scheduled_at, duration_minutes, status")
      .gte("scheduled_at", now)
      .neq("status", "cancelled")
      .order("scheduled_at", { ascending: true })
      .limit(10);
    practitionerUpcoming = data;
  }

  const sessions = practitionerUpcoming ?? [];

  const { data: recentVideos } = await supabase
    .from("videos")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  const nextSession = sessions[0];
  const joinable =
    nextSession &&
    new Date(nextSession.scheduled_at).getTime() - Date.now() <
      24 * 60 * 60 * 1000;

  const firstName =
    profile.full_name?.split(" ")[0] ||
    profile.email.split("@")[0] ||
    "there";

  const emergencyFlag =
    typeof sp.emergency === "string" ? sp.emergency : undefined;
  const emergencyMsg =
    typeof sp.msg === "string" ? sp.msg : undefined;
  const emergencySession =
    typeof sp.session === "string" ? sp.session : undefined;

  const isClient =
    profile.role !== "practitioner" && profile.role !== "admin";

  return (
    <div>
      <div className="mb-10">
        <p className="text-sm text-teal font-medium tracking-wide uppercase mb-1">
          Welcome back
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl text-forest">
          Hello, {firstName}
        </h1>
        <p className="mt-2 text-ink-soft">
          Your sacred space for sessions, recordings, and the path ahead.
        </p>
      </div>

      <EmergencyPortalBanner
        flag={emergencyFlag}
        message={emergencyMsg}
        sessionId={emergencySession}
      />

      {isClient && (
        <div className="mb-8">
          <EmergencyRequestButton />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3 mb-10">
        <div className="lg:col-span-2 space-y-0">
          <Suspense
            fallback={
              <Card className="mb-8">
                <p className="text-sm text-muted">Loading sessions…</p>
              </Card>
            }
          >
            <UpcomingSessionsPanel
              sessions={sessions}
              nextSessionId={joinable ? nextSession?.id : null}
            />
          </Suspense>
        </div>

        <Card>
          <h2 className="font-serif text-xl text-forest mb-4">Quick links</h2>
          <ul className="space-y-2">
            <li>
              <Link
                href="/portal/library"
                className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-forest/5 text-ink-soft hover:text-forest transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <Film className="h-4 w-4 text-teal" />
                  Session library
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </li>
            <li>
              <Link
                href="/portal/profile"
                className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-forest/5 text-ink-soft hover:text-forest transition-colors"
              >
                <span>Profile & intake</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </li>
            <li>
              <Link
                href="/book-session"
                className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-forest/5 text-ink-soft hover:text-forest transition-colors"
              >
                <span>Book another session</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </li>
          </ul>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl text-forest">Recent library</h2>
          <Link
            href="/portal/library"
            className="text-sm text-teal hover:underline inline-flex items-center gap-1"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {!recentVideos?.length ? (
          <p className="text-muted text-sm">
            Session recordings will appear here after your meetings are
            processed.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {recentVideos.map((v) => (
              <Link
                key={v.id}
                href={`/portal/library?video=${v.id}`}
                className="rounded-xl border border-border bg-white p-4 shadow-soft hover:shadow-elevated transition-shadow"
              >
                <p className="font-serif text-forest leading-snug">{v.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {new Date(v.created_at).toLocaleDateString()} · {v.status}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(v.category_tags ?? []).slice(0, 2).map((c) => (
                    <Badge key={c} variant="teal">
                      {c}
                    </Badge>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
