import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getPostsSorted } from "@/lib/blog/posts";
import { CTABanner } from "@/components/home/CTABanner";
import { siteConfig } from "@/lib/content";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.oursacredreference.com";

export const metadata: Metadata = {
  title: "Blog & Resources",
  description:
    "Articles and reflections by Michele Castro on felt sense, somatic embodiment, the Dark Goddess, and a Path of Remembering.",
  alternates: {
    canonical: `${siteUrl}/blog`,
  },
  openGraph: {
    title: `Blog & Resources | ${siteConfig.name}`,
    description:
      "Essays on deconstructing walls, felt sense, mytho-shamanic practice, and embodied spirituality.",
    url: `${siteUrl}/blog`,
    type: "website",
  },
};

export default function BlogPage() {
  const posts = getPostsSorted();

  return (
    <>
      <section className="relative bg-sacred-gradient py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="text-gold-soft text-sm font-medium tracking-[0.15em] uppercase mb-4">
            Resources
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-cream max-w-3xl leading-tight">
            Blog & Resources
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-cream/80 leading-relaxed">
            Reflections from Michele Castro on the felt sense, somatic
            embodiment, feminine wisdom, and the Path of Remembering.
          </p>
        </div>
      </section>

      <Section className="bg-cream">
        <SectionHeader
          eyebrow="Essays"
          title="Reflections for the path"
          description="Full articles from the heart of the work — raw, reverent, and rooted in the body."
        />

        <div className="grid gap-8 max-w-3xl mx-auto">
          {posts.map((post) => (
            <article key={post.slug} id={post.slug} className="scroll-mt-24">
              <Link href={`/blog/${post.slug}`} className="group block">
                <Card hover padding="lg">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <Badge variant="teal">{post.category}</Badge>
                    <span className="text-xs text-muted">
                      {new Date(post.date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      · {post.readTime} read · {post.author}
                    </span>
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl text-forest mb-2 group-hover:text-teal transition-colors">
                    {post.title}
                  </h2>
                  {post.subtitle && (
                    <p className="font-serif text-lg text-ink-soft italic mb-3">
                      {post.subtitle}
                    </p>
                  )}
                  <p className="text-ink-soft leading-relaxed text-lg">
                    {post.excerpt}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-teal">
                    Read full article
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </Card>
              </Link>
            </article>
          ))}
        </div>
      </Section>

      <CTABanner />
    </>
  );
}
