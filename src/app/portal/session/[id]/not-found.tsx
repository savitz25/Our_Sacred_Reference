import { Button } from "@/components/ui/Button";

export default function SessionNotFound() {
  return (
    <div className="py-16 text-center max-w-md mx-auto">
      <h1 className="font-serif text-2xl text-forest mb-3">Session not found</h1>
      <p className="text-ink-soft text-sm mb-6 leading-relaxed">
        This session link is invalid, expired, or you do not have access. Return
        to your dashboard to see upcoming sessions.
      </p>
      <Button href="/portal" variant="primary">
        Back to portal
      </Button>
    </div>
  );
}
