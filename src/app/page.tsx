import { Hero } from "@/components/home/Hero";
import { Mission } from "@/components/home/Mission";
import { ApproachCards } from "@/components/home/ApproachCards";
import { Testimonials } from "@/components/home/Testimonials";
import { CTABanner } from "@/components/home/CTABanner";
import { DisclaimerBanner } from "@/components/legal/DisclaimerBanner";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { blogPosts, offerings } from "@/lib/content";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* Prominent service disclaimer — Phase 3 legal */}
      <div className="bg-cream border-b border-border">
        <DisclaimerBanner variant="hero-below" className="py-6 sm:py-8" />
      </div>
      <Mission />
      <ApproachCards />

      {/* Offerings teaser */}
      <Section className="bg-cream">
        <SectionHeader
          eyebrow="Offerings & Sessions"
          title="Ways to enter the work"
          description="Begin with a complimentary discovery session, then continue in a rhythm that honors your nervous system."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {offerings.map((o) => (
            <Card
              key={o.title}
              hover
              className={
                o.featured
                  ? "ring-2 ring-gold/40 relative overflow-hidden"
                  : undefined
              }
            >
              {o.featured && (
                <Badge variant="gold" className="mb-3">
                  Start here
                </Badge>
              )}
              <h3 className="font-serif text-xl text-forest mb-1">{o.title}</h3>
              <p className="text-sm text-teal mb-3">
                {o.duration} · {o.price}
              </p>
              <p className="text-sm text-ink-soft leading-relaxed mb-5">
                {o.description}
              </p>
              <Button
                href={o.href}
                variant={o.featured ? "gold" : "outline"}
                size="sm"
              >
                {o.cta}
              </Button>
            </Card>
          ))}
        </div>
      </Section>

      <Testimonials />

      {/* Blog teaser */}
      <Section className="bg-cream-dark/40">
        <SectionHeader
          eyebrow="Blog & Resources"
          title="Reflections for the path"
          description="Articles on felt sense, myth as lived experience, and embodied spirituality."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/blog#${post.slug}`} className="group">
              <Card hover className="h-full">
                <Badge variant="teal" className="mb-3">
                  {post.category}
                </Badge>
                <h3 className="font-serif text-xl text-forest group-hover:text-teal transition-colors mb-2">
                  {post.title}
                </h3>
                <p className="text-sm text-ink-soft leading-relaxed mb-4">
                  {post.excerpt}
                </p>
                <span className="inline-flex items-center gap-1 text-sm text-teal font-medium">
                  Read more
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </Card>
            </Link>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button href="/blog" variant="outline">
            All resources
          </Button>
        </div>
      </Section>

      <CTABanner />
    </>
  );
}
