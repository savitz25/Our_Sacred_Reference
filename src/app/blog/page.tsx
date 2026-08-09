import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/ui/Section";
import { getPublishedPosts } from "@/lib/blog/posts";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { CTABanner } from "@/components/home/CTABanner";
import { buildPageMetadata } from "@/lib/seo/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { RelatedPaths } from "@/components/seo/RelatedPaths";
import { getSiteUrl } from "@/lib/seo/site";

/** Rebuild index when content deploys so every post is listed. */
export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Blog — Felt Sense, Somatic Essays & Path of Remembering",
  description:
    "Articles by Michele Castro on felt sense, deconstructing walls, Dark Goddess, somatic embodiment, and mytho-shamanic spirituality. Essays for the Path of Remembering.",
  path: "/blog",
  keywords: [
    "somatic healing blog",
    "felt sense essays",
    "Divine Feminine writing",
    "mytho-shamanic blog",
    "Michele Castro articles",
    "Path of Remembering blog",
  ],
});

export default function BlogPage() {
  // Full published set — never slice on the index
  const posts = getPublishedPosts();
  const site = getSiteUrl();
  const essayCount = posts.length;

  const blogListJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Sacred Reference Blog",
    description:
      "Essays on mytho-shamanic somatic healing, felt sense, and embodied spirituality.",
    url: `${site}/blog`,
    publisher: {
      "@type": "Organization",
      name: "Sacred Reference",
      url: site,
    },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      datePublished: p.date,
      url: `${site}/blog/${p.slug}`,
      author: { "@type": "Person", name: p.author },
    })),
  };

  return (
    <>
      <JsonLd data={blogListJsonLd} />

      <section className="relative bg-sacred-gradient py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Breadcrumbs
            light
            className="mb-6"
            items={[{ name: "Blog", path: "/blog" }]}
          />
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
          {essayCount > 0 && (
            <p className="mt-4 text-sm text-cream/65 tracking-wide">
              {essayCount} {essayCount === 1 ? "essay" : "essays"} · newest first
            </p>
          )}
        </div>
      </section>

      <Section className="bg-cream">
        <SectionHeader
          eyebrow="Essays"
          title="Reflections for the path"
          description="Full articles from the heart of the work — raw, reverent, and rooted in the body."
        />

        {essayCount === 0 ? (
          <p className="text-center text-ink-soft">
            New essays will appear here soon.
          </p>
        ) : (
          <div
            className="grid gap-6 sm:gap-8 md:grid-cols-2 max-w-5xl mx-auto"
            data-blog-post-count={essayCount}
          >
            {posts.map((post) => (
              <BlogPostCard key={post.slug} post={post} variant="index" />
            ))}
          </div>
        )}
      </Section>

      <Section className="bg-cream-dark/30" narrow>
        <RelatedPaths excludeHref="/blog" />
      </Section>

      <CTABanner />
    </>
  );
}
