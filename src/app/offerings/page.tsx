import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { offerings } from "@/lib/content";
import { CTABanner } from "@/components/home/CTABanner";

export const metadata: Metadata = {
  title: "Offerings & Sessions",
  description:
    "Free discovery sessions and ongoing mytho-shamanic somatic work with Michele — secure online video and private session library.",
};

export default function OfferingsPage() {
  return (
    <>
      <section className="relative bg-sacred-gradient py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="text-gold-soft text-sm font-medium tracking-[0.15em] uppercase mb-4">
            Offerings
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-cream max-w-3xl leading-tight">
            Sessions designed for presence
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-cream/80 leading-relaxed">
            Online video sessions with secure rooms, optional private
            recordings, and a client portal that holds your embodied archive.
          </p>
        </div>
      </section>

      <Section className="bg-cream">
        <SectionHeader
          eyebrow="How we work together"
          title="Choose your entry point"
          description="Most clients begin with a free discovery session. From there, we shape a rhythm that supports your nervous system and depth of inquiry."
        />

        <div className="grid gap-8 lg:grid-cols-3">
          {offerings.map((o) => (
            <Card
              key={o.title}
              hover
              padding="lg"
              className={
                o.featured
                  ? "ring-2 ring-gold/50 relative lg:-mt-2 lg:mb-2"
                  : undefined
              }
            >
              {o.featured && (
                <Badge variant="gold" className="mb-4">
                  Recommended first step
                </Badge>
              )}
              <h2 className="font-serif text-2xl text-forest mb-1">{o.title}</h2>
              <p className="text-teal text-sm font-medium mb-4">
                {o.duration} · {o.price}
              </p>
              <p className="text-ink-soft leading-relaxed mb-6">
                {o.description}
              </p>
              <ul className="space-y-3 mb-8">
                {o.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5 text-sm text-ink">
                    <Check
                      className="h-4 w-4 text-teal shrink-0 mt-0.5"
                      aria-hidden
                    />
                    {h}
                  </li>
                ))}
              </ul>
              <Button
                href={o.href}
                variant={o.featured ? "gold" : "primary"}
                className="w-full"
              >
                {o.cta}
              </Button>
            </Card>
          ))}
        </div>
      </Section>

      <Section className="bg-cream-dark/40" narrow>
        <SectionHeader
          title="What to expect in a session"
          align="left"
          description="Sessions unfold at the pace of your nervous system — not a fixed protocol."
        />
        <ol className="space-y-6">
          {[
            {
              t: "Arrive & orient",
              d: "We begin by settling into the body and the relational field of the session.",
            },
            {
              t: "Follow the felt sense",
              d: "Sensation, emotion, image, and story become the language of inquiry.",
            },
            {
              t: "Meet myth & depth",
              d: "When ready, mythic, dream, and archetypal material may enter as living guides.",
            },
            {
              t: "Integrate & archive",
              d: "Sessions may be recorded for your private library, categorized for later reflection.",
            },
          ].map((step, i) => (
            <li key={step.t} className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest text-cream text-sm font-medium">
                {i + 1}
              </span>
              <div>
                <h3 className="font-serif text-xl text-forest">{step.t}</h3>
                <p className="mt-1 text-ink-soft leading-relaxed">{step.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <CTABanner />
    </>
  );
}
