import { Button } from "@/components/ui/Button";
import { formatSessionWhen } from "@/lib/sessions/timing";

interface SessionEndedProps {
  sessionTitle: string;
  scheduledAt: string;
}

export function SessionEnded({
  sessionTitle,
  scheduledAt,
}: SessionEndedProps) {
  return (
    <div className="max-w-lg mx-auto text-center py-12 sm:py-16">
      <p className="text-sm font-medium tracking-[0.15em] uppercase text-teal mb-3">
        Session window closed
      </p>
      <h1 className="font-serif text-3xl sm:text-4xl text-forest mb-4">
        This session has ended
      </h1>
      <p className="text-ink-soft leading-relaxed mb-2">
        <strong className="text-forest">{sessionTitle}</strong>
      </p>
      <p className="text-sm text-muted mb-8">
        Scheduled for {formatSessionWhen(new Date(scheduledAt))}
      </p>
      <p className="text-ink-soft text-sm leading-relaxed mb-10">
        If a recording is available, it will appear in your private session
        library after processing. Thank you for bringing your presence.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button href="/portal/library" variant="gold">
          Session library
        </Button>
        <Button href="/portal" variant="outline">
          Back to portal
        </Button>
      </div>
    </div>
  );
}
