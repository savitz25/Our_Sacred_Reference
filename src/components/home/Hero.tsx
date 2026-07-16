import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { heroContent, siteConfig } from "@/lib/content";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-[88vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80"
          alt="Ancient forest canopy with soft filtered light"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-deep/92 via-forest/78 to-forest/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/65 via-transparent to-forest-deep/25" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 py-24 sm:py-32 w-full">
        <div className="max-w-3xl animate-fade-up">
          <p className="text-gold-soft text-sm sm:text-base font-medium tracking-[0.18em] uppercase mb-4">
            {siteConfig.shortTagline}
          </p>
          <p className="font-serif text-xl sm:text-2xl text-cream/90 italic leading-snug mb-6 max-w-2xl">
            {heroContent.eyebrow}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] text-cream font-medium leading-[1.15] tracking-tight">
            {heroContent.headline}
          </h1>
          <p className="mt-6 font-serif text-2xl sm:text-3xl text-gold-soft leading-snug">
            {heroContent.pathTitle}
          </p>
          <p className="mt-5 text-base sm:text-lg text-cream/80 leading-relaxed max-w-2xl">
            {heroContent.reclaimLead}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button href="/book-session" variant="gold" size="lg">
              {heroContent.ctaPrimary}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Button>
            <Button
              href="/approach"
              variant="outline"
              size="lg"
              className="border-cream/30 text-cream hover:bg-cream/10 hover:border-cream/50"
            >
              {heroContent.ctaSecondary}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
