import type { Metadata } from "next";
import Image from "next/image";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { micheleBio, mission, siteConfig } from "@/lib/content";
import { CTABanner } from "@/components/home/CTABanner";
import { buildPageMetadata } from "@/lib/seo/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { personJsonLd } from "@/lib/seo/json-ld";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { RelatedPaths } from "@/components/seo/RelatedPaths";

export const metadata: Metadata = buildPageMetadata({
  title: "About Michele Castro — Mytho-Shamanic Somatic Practitioner",
  description:
    "Michele Castro — mother, mytho-shamanic somatic practitioner, Divine Mother devotion, and guide on a Path of Remembering. Full biography: lineage, underworld journey, Isis, and embodied spirituality.",
  path: "/about",
  keywords: [
    "Michele Castro",
    "mytho-shamanic practitioner",
    "somatic healing coach biography",
    "Divine Mother embodiment",
    "transpersonal psychology somatic",
    "Sacred Reference founder",
  ],
});

export default function AboutPage() {
  return (
    <>
      <JsonLd data={personJsonLd()} />
      <section className="relative bg-sacred-gradient py-20 sm:py-28 overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <Breadcrumbs
            light
            className="mb-6"
            items={[{ name: "About", path: "/about" }]}
          />
          <p className="text-gold-soft text-sm font-medium tracking-[0.15em] uppercase mb-4">
            About
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-cream max-w-3xl leading-tight">
            {micheleBio.name}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-cream/80 leading-relaxed italic">
            {siteConfig.tagline}
          </p>
          <p className="mt-4 max-w-2xl text-base text-cream/70 leading-relaxed">
            A practice rooted in relationship — with the body, the unconscious,
            myth, Nature, and the Sacred. Devoted to Serve and Embody the
            Divine Mother.
          </p>
        </div>
      </section>

      <Section className="bg-cream">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-elevated lg:sticky lg:top-28">
            <Image
              src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=900&q=80"
              alt="Soft light through forest trees — symbolic portrait space"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
          <div>
            <SectionHeader
              eyebrow="Biography"
              title="First and foremost, a mother"
              align="left"
              className="mb-6"
            />
            <div className="space-y-5 text-ink-soft leading-relaxed">
              <p className="text-lg text-ink">{micheleBio.intro}</p>
              {micheleBio.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Button href="/book-session" variant="gold">
                Book a Free Discovery Session
              </Button>
              <Button href="/approach" variant="outline">
                The Approach
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section className="bg-cream-dark/40" narrow>
        <SectionHeader
          eyebrow={siteConfig.name}
          title={mission.pathTitle}
          description={mission.coreMessage}
        />
        <div className="space-y-5 text-ink-soft text-lg leading-relaxed">
          {mission.practiceParagraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <blockquote className="mt-10 border-l-4 border-gold pl-6">
          <p className="font-serif text-2xl text-forest">
            {mission.closing[0]}
          </p>
          <p className="mt-2 font-serif text-xl text-teal italic">
            {mission.closing[1]}
          </p>
        </blockquote>
      </Section>

      <Section className="bg-cream">
        <div className="rounded-2xl border border-border bg-white p-8 sm:p-12 text-center shadow-soft max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-3xl text-forest mb-4">
            Online, secure, and embodied
          </h2>
          <p className="text-ink-soft leading-relaxed mb-6">
            Sessions are held via secure in-browser video on Sacred Reference.
            After each meeting, recordings can appear in your private portal
            library — an evolving embodied archive of your Path of Remembering.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button href="/approach" variant="primary">
              The Approach
            </Button>
            <Button href="/offerings" variant="outline">
              Offerings
            </Button>
          </div>
        </div>
      </Section>

      <Section className="bg-cream-dark/30" narrow>
        <RelatedPaths excludeHref="/about" />
      </Section>

      <CTABanner />
    </>
  );
}
