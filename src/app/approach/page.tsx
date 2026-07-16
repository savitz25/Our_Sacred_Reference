import type { Metadata } from "next";
import {
  Ear,
  Heart,
  Sparkles,
  Flame,
  Moon,
  Flower2,
  Sun,
} from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";
import { approachPillars, approachHeart } from "@/lib/content";
import { CTABanner } from "@/components/home/CTABanner";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mytho-Shamanic Approach",
  description:
    "The Sacred Reference Approach — seven pillars of embodied healing through felt sense, somatic practice, and mytho-shamanic wisdom.",
};

const iconMap = {
  ear: Ear,
  heart: Heart,
  sparkles: Sparkles,
  flame: Flame,
  moon: Moon,
  flower: Flower2,
  sun: Sun,
} as const;

const extendedNarrative: Record<string, string> = {
  "felt-sense":
    "Before interpretation, before the story we tell ourselves, there is a bodily knowing — a subtle texture of experience Gendlin called the felt sense. We learn to pause, sense, and allow this intelligence to lead.",
  "somatic-healing":
    "Healing does not require forcing the nervous system open. We build capacity gradually so integration can emerge organically, with safety and dignity intact.",
  "inner-child":
    "Younger parts of us often hold unfinished developmental needs. Meeting them with presence and compassion allows those experiences to complete and reorganize within a larger self.",
  "mytho-shamanic":
    "Myths, dreams, symbols, and archetypes are not only maps — they are living presences. Mytho-shamanic practice invites them as guides that move through body and imagination together.",
  jungian:
    "The unconscious speaks in image and pattern. Through shadow work, active imagination, and archetypal awareness, we enter dialogue with what wants to be known.",
  "divine-mother":
    "Embodying the Divine Mother is an inner cultivation of nourishment, protection, and unconditional presence — a sacred reference point that steadies the journey.",
  "embodied-spirituality":
    "Insight alone is not enough. We bridge mystical experience with nervous system regulation so revelation becomes lived wisdom in ordinary life.",
};

export default function ApproachPage() {
  return (
    <>
      <section className="relative bg-sacred-gradient py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="text-gold-soft text-sm font-medium tracking-[0.15em] uppercase mb-4">
            Methodology
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-cream max-w-3xl leading-tight">
            Mytho-Shamanic Approach
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-cream/80 leading-relaxed">
            Entering into relationship with sensation, dreams, myth, the
            unconscious, the body, Nature, and the Sacred.
          </p>
        </div>
      </section>

      <Section className="bg-cream" narrow>
        <SectionHeader
          title="Relationship, not technique alone"
          description={approachHeart.body}
          align="left"
        />
      </Section>

      <Section className="bg-cream-dark/30">
        <SectionHeader
          eyebrow="Seven Pillars"
          title="The Sacred Reference Approach"
          description="Each pillar is offered exactly as held in the practice — expanded here with narrative context for seekers and clients."
        />

        <div className="space-y-6 max-w-4xl mx-auto">
          {approachPillars.map((pillar, index) => {
            const Icon = iconMap[pillar.icon];
            return (
              <article
                key={pillar.id}
                id={pillar.id}
                className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-soft scroll-mt-24"
              >
                <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
                  <div
                    className={cn(
                      "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
                      pillar.color === "gold" && "bg-gold/15 text-gold-muted",
                      pillar.color === "teal" && "bg-teal/10 text-teal",
                      pillar.color === "forest" && "bg-forest/10 text-forest"
                    )}
                  >
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-xs font-medium tracking-widest text-muted uppercase">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h2 className="font-serif text-2xl text-forest">
                        {pillar.title}
                      </h2>
                    </div>
                    <p className="text-ink font-medium leading-relaxed mb-3">
                      {pillar.description}
                    </p>
                    <p className="text-ink-soft leading-relaxed">
                      {extendedNarrative[pillar.id]}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Section>

      <Section className="bg-cream">
        <div className="rounded-2xl bg-sacred-gradient p-8 sm:p-12 text-center text-cream max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-3xl mb-4">
            {approachHeart.title}
          </h2>
          <p className="text-cream/85 leading-relaxed mb-2">
            The felt sense is the doorway. Mythology gives language. A
            mytho-shamanic perspective turns the psyche into a living landscape.
          </p>
        </div>
      </Section>

      <CTABanner />
    </>
  );
}
