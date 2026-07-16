import type { Metadata } from "next";
import Image from "next/image";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { mission, siteConfig } from "@/lib/content";
import { CTABanner } from "@/components/home/CTABanner";

export const metadata: Metadata = {
  title: "About Michele & Sacred Reference",
  description:
    "Learn about Michele and Sacred Reference — mytho-shamanic somatic healing integrating felt sense, Jungian depth psychology, and embodied spirituality.",
};

export default function AboutPage() {
  return (
    <>
      <section className="relative bg-sacred-gradient py-20 sm:py-28 overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <p className="text-gold-soft text-sm font-medium tracking-[0.15em] uppercase mb-4">
            About
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-cream max-w-3xl leading-tight">
            Michele & Sacred Reference
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-cream/80 leading-relaxed">
            A practice rooted in relationship — with the body, the unconscious,
            myth, Nature, and the Sacred.
          </p>
        </div>
      </section>

      <Section className="bg-cream">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-elevated">
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
              title="An integrative path few walk"
              align="left"
              className="mb-6"
            />
            <div className="space-y-4 text-ink-soft leading-relaxed">
              <p>
                Michele offers online video sessions that integrate somatic
                practice, the felt sense, attachment science, Jungian depth
                psychology, mythology, and{" "}
                <strong className="text-forest">mytho-shamanic wisdom</strong>.
              </p>
              <p>
                Very few practitioners bring the felt sense together with
                mytho-shamanic consciousness in a way that makes myth a lived,
                embodied experience rather than an intellectual framework. This
                integration is the heart of Sacred Reference.
              </p>
              <p>
                The work teaches{" "}
                <em className="text-forest not-italic font-medium">
                  relationship
                </em>{" "}
                — with sensation, dreams, myth, the unconscious, the body,
                Nature, and the Sacred — rather than a set of techniques alone.
                The felt sense is the doorway; mythology gives language; a
                mytho-shamanic perspective turns the psyche into a living
                landscape.
              </p>
            </div>
            <div className="mt-8">
              <Button href="/book-session" variant="gold">
                Book a Free Discovery Session
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section className="bg-cream-dark/40" narrow>
        <SectionHeader
          eyebrow={siteConfig.name}
          title={mission.title}
          description="Our mission is the anchor of everything we offer."
        />
        <div className="space-y-5 text-ink-soft text-lg leading-relaxed">
          {mission.paragraphs.map((p, i) => (
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
            Sessions are held via secure in-browser video. After each meeting,
            recordings can appear in your private portal library — an evolving
            embodied archive of your work together.
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

      <CTABanner />
    </>
  );
}
