import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/lib/content";
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
        <div className="absolute inset-0 bg-gradient-to-r from-forest-deep/90 via-forest/75 to-forest/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/60 via-transparent to-forest-deep/20" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 py-24 sm:py-32 w-full">
        <div className="max-w-2xl animate-fade-up">
          <p className="text-gold-soft text-sm sm:text-base font-medium tracking-[0.2em] uppercase mb-5">
            {siteConfig.tagline}
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-cream font-medium leading-[1.1] tracking-tight">
            Remember the sacred intelligence within you
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-cream/85 leading-relaxed max-w-xl">
            Online sessions integrating somatic practice, the felt sense,
            attachment science, Jungian depth psychology, mythology, and{" "}
            <span className="text-gold-soft font-medium">mytho-shamanic</span>{" "}
            wisdom — where myth becomes a lived, embodied experience.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button href="/book-session" variant="gold" size="lg">
              Schedule Your Free Discovery Session
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Button>
            <Button
              href="/approach"
              variant="outline"
              size="lg"
              className="border-cream/30 text-cream hover:bg-cream/10 hover:border-cream/50"
            >
              Explore the Approach
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
