import { CheckCircle2, Film, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function SessionCompletePage() {
  const { user } = await requireProfile();
  const supabase = await createClient();

  const { data: latest } = await supabase
    .from("videos")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="max-w-2xl mx-auto text-center py-8">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal/10 text-teal">
        <CheckCircle2 className="h-10 w-10" aria-hidden />
      </div>
      <h1 className="font-serif text-3xl sm:text-4xl text-forest mb-4">
        {latest?.status === "ready"
          ? "Video processed and ready"
          : "Video processing queued"}
      </h1>
      <p className="text-lg text-ink-soft leading-relaxed mb-4">
        {latest
          ? `“${latest.title}” — status: ${latest.status}`
          : "Your session recording pipeline has been triggered."}
      </p>
      <p className="text-sm text-muted mb-10">
        Automated steps: complete session → store metadata → categorize by
        approach pillars → optional Resend email. LiveKit egress + FFmpeg worker
        complete the media file path.
      </p>

      <div className="grid gap-4 sm:grid-cols-3 text-left mb-10">
        {[
          {
            icon: Film,
            title: "Processed",
            body: "Metadata stored; FFmpeg trim ready for worker.",
          },
          {
            icon: Sparkles,
            title: "Categorized",
            body: (latest?.category_tags ?? ["Felt Sense"]).join(", "),
          },
          {
            icon: Mail,
            title: "Notified",
            body: process.env.RESEND_API_KEY
              ? "Email configured"
              : "Add RESEND_API_KEY for email",
          },
        ].map((item) => (
          <Card
            key={item.title}
            padding="sm"
            className="text-center sm:text-left"
          >
            <item.icon className="h-5 w-5 text-teal mb-2 mx-auto sm:mx-0" />
            <h2 className="font-medium text-forest text-sm mb-1">
              {item.title}
            </h2>
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
