import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

export function CTABanner() {
  return (
    <section className="relative overflow-hidden bg-sacred-gradient py-20 sm:py-24">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, rgba(212,160,23,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(42,140,126,0.3) 0%, transparent 40%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-5 sm:px-8 text-center">
        <p className="text-gold-soft text-sm font-medium tracking-[0.15em] uppercase mb-4">
          A Path of Remembering
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-cream font-medium leading-tight">
          Schedule your free discovery session
        </h2>
        <p className="mt-5 text-cream/80 text-lg leading-relaxed">
          A gentle introduction to this mytho-shamanic return to the wisdom of
          your soul — no commitment, just presence, curiosity, and a
          conversation with your body&apos;s sacred messages.
        </p>
        <div className="mt-10">
          <Button href="/book-session" variant="gold" size="lg">
            Work With Me
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Button>
        </div>
      </div>
    </section>
  );
}
