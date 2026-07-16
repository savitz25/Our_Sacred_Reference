import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { offerings } from "@/lib/content";
import { CTABanner } from "@/components/home/CTABanner";
import { buildPageMetadata } from "@/lib/seo/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { professionalServiceJsonLd } from "@/lib/seo/json-ld";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { RelatedPaths } from "@/components/seo/RelatedPaths";

export const metadata: Metadata = buildPageMetadata({
  title: "Offerings & Sessions — Online Mytho-Shamanic Somatic Healing",
  description:
    "Free discovery sessions, individual mytho-shamanic somatic work, and ongoing embodied path packages with Michele Castro. Secure online video and private session library.",
  path: "/offerings",
  keywords: [
    "online somatic healing sessions",
    "free discovery session coaching",
    "mytho-shamanic individual sessions",
    "embodied spirituality packages",
    "book somatic coaching online",
  ],
});

export default function OfferingsPage() {
  return (
    <>
      <JsonLd data={professionalServiceJsonLd()} />
      <section className="relative bg-sacred-gradient py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Breadcrumbs
            light
            className="mb-6"
            items={[{ name: "Offerings", path: "/offerings" }]}
          />
          <p className="text-gold-soft text-sm font-medium tracking-[0.15em] uppercase mb-4">
            Offerings
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-cream max-w-3xl leading-tight">
            Ways to walk the Path of Remembering
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-cream/80 leading-relaxed">
            Online video sessions where symptoms become soul-language —
            secure rooms, optional private recordings, and a portal that holds
            your embodied archive.
          </p>
        </div>
      </section>

      <Section className="bg-cream">
        <SectionHeader
          eyebrow="How we work together"
          title="Choose your entry point"
          description="Most people begin with a free discovery session. From there, we shape a rhythm that honors your nervous system — weekly, bi-weekly, or monthly — as we learn to turn toward what is ready to be heard."
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
              d: "We settle into the body and the relational field — without rush, without force.",
            },
            {
              t: "Listen to soul-language",
              d: "Sensation, emotion, image, and story become the language of inquiry. Symptoms are sacred messages we learn to decipher.",
            },
            {
              t: "Turn toward with reverence",
              d: "We strengthen capacity for unconditional love and curiosity toward parts in suffering, pain, or exile — Gently, Curiously, Reverently.",
            },
            {
              t: "Integrate & remember",
              d: "What was fragmented reorganizes toward wholeness. Sessions may be recorded for your private library — an embodied archive of your Path of Remembering.",
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

      <Section className="bg-cream-dark/30" narrow>
        <RelatedPaths excludeHref="/offerings" />
      </Section>

      <CTABanner />
    </>
  );
}
