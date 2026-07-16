import { mission } from "@/lib/content";
import { Section } from "@/components/ui/Section";

export function Mission() {
  return (
    <Section id="mission" className="bg-cream" narrow>
      <div className="text-center animate-fade-up">
        <p className="text-sm font-medium tracking-[0.15em] uppercase text-teal mb-3">
          Sacred Reference
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-forest font-medium">
          {mission.title}
        </h2>
        <p className="mt-5 font-serif text-xl sm:text-2xl text-ink-soft italic max-w-2xl mx-auto leading-snug">
          {mission.coreMessage}
        </p>
      </div>

      <div className="mt-12 space-y-6 text-ink-soft text-lg leading-relaxed">
        {mission.paragraphs.map((p, i) => (
          <p
            key={i}
            className={
              i === 0 || i === 1
                ? "text-xl text-ink font-medium"
                : i === 2
                  ? "text-ink leading-relaxed"
                  : undefined
            }
          >
            {p}
          </p>
        ))}
      </div>

      <blockquote className="mt-12 border-l-4 border-gold pl-6 sm:pl-8">
        <p className="font-serif text-2xl sm:text-3xl text-forest leading-snug">
          {mission.closing[0]}
        </p>
        <p className="mt-3 font-serif text-xl sm:text-2xl text-teal italic leading-snug">
          {mission.closing[1]}
        </p>
      </blockquote>
    </Section>
  );
}
