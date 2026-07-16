"use client";

import { useState } from "react";
import {
  Ear,
  Heart,
  Sparkles,
  Flame,
  Moon,
  Flower2,
  Sun,
  ChevronDown,
} from "lucide-react";
import { approachPillars, approachHeart } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const iconMap = {
  ear: Ear,
  heart: Heart,
  sparkles: Sparkles,
  flame: Flame,
  moon: Moon,
  flower: Flower2,
  sun: Sun,
} as const;

export function ApproachCards() {
  const [openId, setOpenId] = useState<string | null>(approachPillars[0].id);
  const [view, setView] = useState<"cards" | "accordion">("cards");

  return (
    <Section id="approach" className="bg-cream-dark/50">
      <SectionHeader
        eyebrow="Sacred Reference Approach"
        title="Seven pillars of embodied healing"
        description="A Path of Remembering. The felt sense is the doorway; mythology gives language; a mytho-shamanic perspective turns the psyche into a living landscape."
      />

      <div className="mb-8 flex justify-center gap-2" role="tablist" aria-label="View mode">
        <button
          type="button"
          role="tab"
          aria-selected={view === "cards"}
          onClick={() => setView("cards")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm transition-colors",
            view === "cards"
              ? "bg-forest text-cream"
              : "text-ink-soft hover:bg-forest/5"
          )}
        >
          Cards
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "accordion"}
          onClick={() => setView("accordion")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm transition-colors",
            view === "accordion"
              ? "bg-forest text-cream"
              : "text-ink-soft hover:bg-forest/5"
          )}
        >
          Accordion
        </button>
      </div>

      {view === "cards" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {approachPillars.map((pillar, i) => {
            const Icon = iconMap[pillar.icon];
            return (
              <article
                key={pillar.id}
                className={cn(
                  "group rounded-2xl bg-white border border-border p-6 sm:p-7 shadow-soft transition-all duration-300 hover:shadow-elevated hover:-translate-y-0.5 hover:border-teal/25",
                  i === 6 && "sm:col-span-2 lg:col-span-1 lg:col-start-2"
                )}
              >
                <div
                  className={cn(
                    "mb-4 flex h-11 w-11 items-center justify-center rounded-xl",
                    pillar.color === "gold" && "bg-gold/15 text-gold-muted",
                    pillar.color === "teal" && "bg-teal/10 text-teal",
                    pillar.color === "forest" && "bg-forest/10 text-forest"
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="font-serif text-xl text-forest mb-2">
                  {pillar.title}
                </h3>
                <p className="text-ink-soft text-sm sm:text-base leading-relaxed">
                  {pillar.description}
                </p>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mx-auto max-w-2xl space-y-2">
          {approachPillars.map((pillar) => {
            const Icon = iconMap[pillar.icon];
            const isOpen = openId === pillar.id;
            return (
              <div
                key={pillar.id}
                className="rounded-2xl border border-border bg-white overflow-hidden shadow-soft"
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-cream/50 transition-colors"
                  onClick={() => setOpenId(isOpen ? null : pillar.id)}
                  aria-expanded={isOpen}
                >
                  <Icon className="h-5 w-5 text-teal shrink-0" aria-hidden />
                  <span className="font-serif text-lg text-forest flex-1">
                    {pillar.title}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 text-muted transition-transform",
                      isOpen && "rotate-180"
                    )}
                    aria-hidden
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-0 text-ink-soft leading-relaxed border-t border-border/50">
                    <p className="pt-4">{pillar.description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-14 rounded-2xl bg-sacred-gradient p-8 sm:p-10 text-center text-cream">
        <h3 className="font-serif text-2xl sm:text-3xl mb-4">
          {approachHeart.title}
        </h3>
        <p className="mx-auto max-w-2xl text-cream/85 leading-relaxed">
          {approachHeart.body}
        </p>
        <div className="mt-8">
          <Button href="/approach" variant="gold">
            Full Methodology
          </Button>
        </div>
      </div>
    </Section>
  );
}
