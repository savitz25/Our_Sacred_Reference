import { testimonials } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Quote } from "lucide-react";

export function Testimonials() {
  return (
    <Section className="bg-cream">
      <SectionHeader
        eyebrow="Embodied Stories"
        title="Reflections from the path"
        description="Client experiences shared with permission — anonymized, heartfelt, and rooted in presence."
      />
      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <figure
            key={i}
            className="relative rounded-2xl bg-white border border-border p-6 sm:p-8 shadow-soft"
          >
            <Quote
              className="absolute top-6 right-6 h-8 w-8 text-gold/30"
              aria-hidden
            />
            <blockquote className="font-serif text-lg text-forest leading-relaxed">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-6 text-sm text-muted">
              <span className="font-medium text-ink-soft">{t.author}</span>
              <span className="mx-1.5">·</span>
              {t.role}
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
