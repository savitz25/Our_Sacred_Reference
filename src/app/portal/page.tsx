import Link from "next/link";
import { Video, Calendar, Film, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { mockClient, mockUpcomingSessions, mockVideos } from "@/lib/mock-data";

export default function PortalDashboardPage() {
  const nextSession = mockUpcomingSessions[0];
  const recentVideos = mockVideos.slice(0, 3);

  return (
    <div>
      <div className="mb-10">
        <p className="text-sm text-teal font-medium tracking-wide uppercase mb-1">
          Welcome back
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl text-forest">
          Hello, {mockClient.name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-ink-soft">
          Your sacred space for sessions, recordings, and the path ahead.
        </p>
      </div>

      {/* Quick join */}
      {nextSession?.joinable && (
        <Card className="mb-8 bg-sacred-gradient border-0 text-cream !shadow-elevated">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <Badge className="mb-3 !bg-gold/20 !text-gold-soft">
                Starting soon
              </Badge>
              <h2 className="font-serif text-2xl mb-1">{nextSession.title}</h2>
              <p className="text-cream/75 text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" aria-hidden />
                {new Date(nextSession.datetime).toLocaleString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                · {nextSession.duration}
              </p>
            </div>
            <Button
              href={`/portal/session/${nextSession.id}`}
              variant="gold"
              size="lg"
            >
              <Video className="h-5 w-5" aria-hidden />
              Join Secure Video Session
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3 mb-10">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-xl text-forest flex items-center gap-2">
              <Calendar className="h-5 w-5 text-teal" aria-hidden />
              Upcoming sessions
            </h2>
          </div>
          <ul className="space-y-3">
            {mockUpcomingSessions.map((s) => (
              <li
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-cream/50 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-ink">{s.title}</p>
                  <p className="text-sm text-muted">
                    {new Date(s.datetime).toLocaleString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}{" "}
                    · {s.duration}
                  </p>
                </div>
                {s.joinable ? (
                  <Button href={`/portal/session/${s.id}`} size="sm" variant="secondary">
                    Join
                  </Button>
                ) : (
                  <Badge variant="outline">Scheduled</Badge>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">
            Rescheduling will connect to Cal.com / custom calendar in Phase 2.
            Past sessions are read-only.
          </p>
        </Card>

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
        <div className="grid gap-4 sm:grid-cols-3">
          {recentVideos.map((v) => (
            <Link
              key={v.id}
              href={`/portal/session/${v.sessionId}`}
              className="rounded-xl border border-border bg-white p-4 shadow-soft hover:shadow-elevated transition-shadow"
            >
              <p className="font-serif text-forest leading-snug">{v.title}</p>
              <p className="mt-1 text-xs text-muted">
                {new Date(v.date).toLocaleDateString()} · {v.duration}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {v.categories.slice(0, 2).map((c) => (
                  <Badge key={c} variant="teal">
                    {c}
                  </Badge>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
