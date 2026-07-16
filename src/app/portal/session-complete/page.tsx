import { CheckCircle2, Film, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function SessionCompletePage() {
  return (
    <div className="max-w-2xl mx-auto text-center py-8">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal/10 text-teal">
        <CheckCircle2 className="h-10 w-10" aria-hidden />
      </div>
      <h1 className="font-serif text-3xl sm:text-4xl text-forest mb-4">
        Video automatically processed
      </h1>
      <p className="text-lg text-ink-soft leading-relaxed mb-10">
        Your session has been edited, categorized, and added to your private
        library — typically within minutes.
      </p>

      <div className="grid gap-4 sm:grid-cols-3 text-left mb-10">
        {[
          {
            icon: Film,
            title: "Processed & trimmed",
            body: "Basic silence/filler trim via FFmpeg pipeline (placeholder).",
          },
          {
            icon: Sparkles,
            title: "Categorized",
            body: "Tagged by pillars e.g. Felt Sense, Mytho-Shamanic Journey.",
          },
          {
            icon: Mail,
            title: "Notified",
            body: "Email when ready — privacy-first, no public AI on content.",
          },
        ].map((item) => (
          <Card key={item.title} padding="sm" className="text-center sm:text-left">
            <item.icon className="h-5 w-5 text-teal mb-2 mx-auto sm:mx-0" />
            <h2 className="font-medium text-forest text-sm mb-1">{item.title}</h2>
            <p className="text-xs text-muted leading-relaxed">{item.body}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button href="/portal/library" variant="gold">
          Open session library
        </Button>
        <Button href="/portal" variant="outline">
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}
