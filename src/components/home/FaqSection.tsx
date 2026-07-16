import { Section, SectionHeader } from "@/components/ui/Section";
import { homeFaqs } from "@/lib/seo/json-ld";

export function FaqSection() {
  return (
    <Section id="faq" className="bg-cream" narrow>
      <SectionHeader
        eyebrow="Common questions"
        title="Path of Remembering — FAQ"
        description="Clear answers for seekers of mytho-shamanic somatic work, felt sense, and online sessions with Sacred Reference."
      />
      <div className="space-y-4">
        {homeFaqs.map((faq) => (
          <details
            key={faq.question}
            className="group rounded-2xl border border-border bg-white px-5 py-4 shadow-soft open:shadow-elevated"
          >
            <summary className="cursor-pointer list-none font-serif text-lg sm:text-xl text-forest pr-6 relative marker:content-none [&::-webkit-details-marker]:hidden">
              {faq.question}
              <span
                className="absolute right-0 top-1 text-teal text-xl leading-none group-open:rotate-45 transition-transform"
                aria-hidden
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-ink-soft leading-relaxed border-t border-border/60 pt-3">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}
