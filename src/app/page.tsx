import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { Mission } from "@/components/home/Mission";
import { ApproachCards } from "@/components/home/ApproachCards";
import { Testimonials } from "@/components/home/Testimonials";
import { CTABanner } from "@/components/home/CTABanner";
import { FaqSection } from "@/components/home/FaqSection";
import { DisclaimerBanner } from "@/components/legal/DisclaimerBanner";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { offerings } from "@/lib/content";
import { getPostsSorted } from "@/lib/blog/posts";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { homeFaqs, homeGraphJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata, SEO } from "@/lib/seo/site";
import { RelatedPaths } from "@/components/seo/RelatedPaths";

export const metadata: Metadata = buildPageMetadata({
  title: SEO.defaultTitle,
  description: SEO.defaultDescription,
  path: "/",
});

export default function HomePage() {
  const blogPosts = getPostsSorted().slice(0, 3);

  return (
    <>
      <JsonLd data={homeGraphJsonLd(homeFaqs)} />

      <Hero />
      <div className="bg-cream border-b border-border">
        <DisclaimerBanner variant="hero-below" className="py-6 sm:py-8" />
      </div>
      <Mission />
      <ApproachCards />

      <Section className="bg-cream">
        <SectionHeader
          eyebrow="Offerings & Sessions"
          title="Ways to enter the work"
          description="Begin with a complimentary discovery session. Then continue in a rhythm that honors your nervous system — as symptoms become soul-language on a Path of Remembering."
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
        <p className="mt-8 text-center text-sm text-ink-soft">
          Explore the full{" "}
          <Link href="/offerings" className="text-teal font-medium hover:underline">
            offerings
          </Link>
          , the{" "}
          <Link href="/approach" className="text-teal font-medium hover:underline">
            seven-pillar approach
          </Link>
          , or{" "}
          <Link href="/about" className="text-teal font-medium hover:underline">
            Michele&apos;s story
          </Link>
          .
        </p>
      </Section>

      <Testimonials />

      <Section className="bg-cream-dark/40">
        <SectionHeader
          eyebrow="Blog & Resources"
          title="Reflections for the Path of Remembering"
          description="Essays from Michele on felt sense, deconstructing survival walls, Divine Feminine, and embodied spirituality."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group"
            >
              <Card hover className="h-full">
                <Badge variant="teal" className="mb-3">
                  {post.category}
                </Badge>
                <h3 className="font-serif text-xl text-forest group-hover:text-teal transition-colors mb-2">
                  {post.title}
                </h3>
                {post.subtitle && (
                  <p className="text-sm text-ink-soft italic mb-2 line-clamp-2">
                    {post.subtitle}
                  </p>
                )}
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

      <FaqSection />

      <Section className="bg-cream-dark/30" narrow>
        <RelatedPaths excludeHref="/" title="Explore Sacred Reference" />
      </Section>

      <CTABanner />
    </>
  );
}
