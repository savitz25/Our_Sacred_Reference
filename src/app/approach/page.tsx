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
import { approachPillars, approachHeart, mission } from "@/lib/content";
import { CTABanner } from "@/components/home/CTABanner";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mytho-Shamanic Approach",
  description:
    "The Sacred Reference Approach — seven pillars of embodied healing. A Path of Remembering through felt sense, somatic practice, and mytho-shamanic wisdom.",
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
    "Before interpretation, before the story we tell ourselves, there is a bodily knowing — a subtle texture of experience. Every symptom, emotion, relationship, and life circumstance carries information. We learn to pause, sense, and allow this intelligence to lead at the threshold where symptoms become soul-language.",
  "somatic-healing":
    "Healing is not about having a problem to be fixed. We build nervous system capacity so integration can emerge organically — without force, without abandonment — in the feminine wisdom that does not rush.",
  "inner-child":
    "Younger parts of us often hold unfinished developmental needs and experiences that have been exiled. Meeting them with unconditional love, compassion, and curiosity allows those experiences to complete and reorganize within a larger Self.",
  "mytho-shamanic":
    "Myths, dreams, symbols, and archetypes are not only maps — they are living presences. Mytho-shamanic practice invites them as guides that move through body and imagination together: a return to the wisdom of your soul.",
  jungian:
    "The unconscious speaks in image and pattern. Through shadow work, active imagination, and archetypal awareness, we enter dialogue with what wants to be known — including the Dark Night of Soul and the Dark Night of the Ego as Initiation rather than failure.",
  "divine-mother":
    "Embodying the Divine Mother is an inner cultivation of nourishment, protection, and unconditional presence — a sacred reference point that steadies the journey and repairs a disrupted connection with the feminine sacred.",
  "embodied-spirituality":
    "Insight alone is not enough. We bridge mystical experience with nervous system regulation so revelation becomes lived wisdom in ordinary life — Body, Mind, and Spirit working together.",
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
          <p className="mt-6 max-w-2xl text-lg text-cream/85 leading-relaxed italic">
            A mytho-shamanic return to the wisdom of your soul…
          </p>
          <p className="mt-4 max-w-2xl text-base text-cream/75 leading-relaxed">
            Entering into relationship with sensation, dreams, myth, the
            unconscious, the body, Nature, and the Sacred — turning toward what
            is in suffering Gently, Curiously, Reverently.
          </p>
        </div>
      </section>

      <Section className="bg-cream" narrow>
        <SectionHeader
          title="Relationship, not technique alone"
          description={approachHeart.body}
          align="left"
        />
        <div className="mt-8 space-y-4 text-ink-soft leading-relaxed">
          <p className="text-lg text-ink font-medium">{mission.paragraphs[0]}</p>
          <p>{mission.paragraphs[1]}</p>
          <p>{mission.paragraphs[2]}</p>
        </div>
      </Section>

      <Section className="bg-cream-dark/30">
        <SectionHeader
          eyebrow="Seven Pillars"
          title="The Sacred Reference Approach"
          description="Each pillar supports a Path of Remembering — where healing is Initiation, not a problem to be fixed."
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
          <p className="text-cream/85 leading-relaxed mb-4">
            The felt sense is the doorway. Mythology gives language. A
            mytho-shamanic perspective turns the psyche into a living landscape.
          </p>
          <p className="font-serif text-xl text-gold-soft italic">
            {mission.closing[1]}
          </p>
        </div>
      </Section>

      <CTABanner />
    </>
  );
}
